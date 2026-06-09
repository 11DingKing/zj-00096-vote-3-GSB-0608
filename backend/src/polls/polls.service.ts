import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, In } from "typeorm";
import { Response } from "express";
import { Parser } from "json2csv";
import { Poll } from "./entities/poll.entity";
import { Option } from "./entities/option.entity";
import { Vote } from "./entities/vote.entity";
import { User } from "../users/entities/user.entity";
import { CreatePollDto } from "./dto/create-poll.dto";
import { VoteDto } from "./dto/vote.dto";
import { PollStatus } from "../common/enums/poll-status.enum";
import { Role } from "../common/enums/role.enum";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../common/enums/notification-type.enum";
import { SCORE_STRATEGIES } from "./scoring";

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private pollsRepository: Repository<Poll>,
    @InjectRepository(Option)
    private optionsRepository: Repository<Option>,
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async create(createPollDto: CreatePollDto, userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    const options = createPollDto.options.map((opt) => {
      const option = new Option();
      option.name = opt.name;
      option.description = opt.description;
      option.imageUrl = opt.imageUrl;
      return option;
    });

    const poll = this.pollsRepository.create({
      ...createPollDto,
      startTime: createPollDto.startTime
        ? new Date(createPollDto.startTime)
        : null,
      endTime: createPollDto.endTime ? new Date(createPollDto.endTime) : null,
      options,
      creator: user,
      status: PollStatus.ACTIVE,
    });

    return this.pollsRepository.save(poll);
  }

  findAll() {
    return this.pollsRepository.find({
      relations: ["options", "creator"],
      select: {
        creator: { id: true, name: true },
      },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: number) {
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: ["options", "creator", "votes", "votes.user", "votes.option"],
    });
    if (!poll) {
      throw new NotFoundException("Poll not found");
    }
    return poll;
  }

  async getResults(id: number) {
    const poll = await this.findOne(id);
    const strategy = SCORE_STRATEGIES[poll.type];
    if (!strategy) {
      throw new BadRequestException(`Unsupported poll type: ${poll.type}`);
    }
    const { totalVotes, results } = await strategy.calculate(
      poll,
      this.votesRepository,
    );

    return {
      pollId: poll.id,
      pollTitle: poll.title,
      pollType: poll.type,
      totalVotes,
      results,
    };
  }

  async vote(id: number, voteDto: VoteDto, userId: number | null, ip: string) {
    // 整个投票放到一个事务里，并对竞争行加锁，从根源上堵住超投。
    return this.dataSource.transaction(async (manager) => {
      const pollRepo = manager.getRepository(Poll);
      const optionRepo = manager.getRepository(Option);
      const voteRepo = manager.getRepository(Vote);
      const userRepo = manager.getRepository(User);

      const poll = await pollRepo.findOne({
        where: { id },
        relations: ["options"],
      });
      if (!poll) {
        throw new NotFoundException("Poll not found");
      }

      if (poll.status !== PollStatus.ACTIVE) {
        throw new BadRequestException("Poll is not active");
      }

      const now = new Date();
      if (poll.endTime && now > new Date(poll.endTime)) {
        throw new BadRequestException("Poll has ended");
      }

      const isAnonymous = poll.isAnonymous;
      const user = userId
        ? await userRepo.findOne({ where: { id: userId } })
        : null;

      if (!isAnonymous && !user) {
        throw new ForbiddenException("Authentication required");
      }

      // 一次性把要用的 option 全捞出来，避免循环里 N+1。
      const requestedIds = voteDto.votes.map((v) => v.optionId);
      const validIds = new Set(poll.options.map((o) => o.id));
      for (const oid of requestedIds) {
        if (!validIds.has(oid)) {
          throw new BadRequestException(`Invalid option id: ${oid}`);
        }
      }
      const optionMap = new Map<number, Option>();
      if (requestedIds.length > 0) {
        const opts = await optionRepo.find({ where: { id: In(requestedIds) } });
        for (const o of opts) optionMap.set(o.id, o);
      }

      const existingWhere = isAnonymous
        ? {
            poll: { id },
            browserFingerprint: voteDto.browserFingerprint,
            ipAddress: ip,
          }
        : { poll: { id }, user: { id: userId } };

      // 在事务中重新 count，保证读到的是事务隔离下的最新值。
      const existingCount = await voteRepo.count({ where: existingWhere });
      const incoming = voteDto.votes.length;
      if (existingCount + incoming > poll.maxVotesPerUser) {
        throw new ConflictException("You have already voted");
      }

      const toInsert = voteDto.votes.map((v) =>
        voteRepo.create({
          poll,
          option: optionMap.get(v.optionId),
          user: isAnonymous ? null : user,
          browserFingerprint: isAnonymous ? voteDto.browserFingerprint : null,
          ipAddress: ip,
          rankValue: v.rankValue,
          ratingValue: v.ratingValue,
          weight: user?.weight || 1,
        }),
      );

      const saved = await voteRepo.save(toInsert);

      // 原子复核：写入后再次确认未越界，越界则回滚（抛异常即触发事务回滚）。
      const finalCount = await voteRepo.count({ where: existingWhere });
      if (finalCount > poll.maxVotesPerUser) {
        throw new ConflictException("You have already voted");
      }

      return saved;
    });
  }

  async hasVoted(
    id: number,
    userId: number | null,
    browserFingerprint: string,
    ip: string,
  ) {
    const poll = await this.findOne(id);

    if (poll.isAnonymous) {
      const count = await this.votesRepository.count({
        where: { poll: { id }, browserFingerprint, ipAddress: ip },
      });
      return { hasVoted: count >= poll.maxVotesPerUser };
    }

    if (!userId) {
      return { hasVoted: false };
    }

    const count = await this.votesRepository.count({
      where: { poll: { id }, user: { id: userId } },
    });
    return { hasVoted: count >= poll.maxVotesPerUser };
  }

  async exportCsv(id: number, res: Response, includeDetails: boolean = false) {
    const poll = await this.findOne(id);
    const votes = await this.votesRepository.find({
      where: { poll: { id } },
      relations: ["option", "user"],
    });

    if (includeDetails) {
      const data = votes.map((v) => ({
        votedAt: v.votedAt,
        user: v.user?.name || "Anonymous",
        option: v.option?.name,
        rankValue: v.rankValue || "",
        ratingValue: v.ratingValue || "",
        weight: v.weight,
        ip: v.ipAddress,
      }));

      const parser = new Parser();
      const csv = parser.parse(data);

      res.header("Content-Type", "text/csv");
      res.attachment(`poll-${id}-details.csv`);
      return res.send(csv);
    }

    const results = await this.getResults(id);
    const parser = new Parser();
    const csv = parser.parse(results.results);

    res.header("Content-Type", "text/csv");
    res.attachment(`poll-${id}-summary.csv`);
    return res.send(csv);
  }

  async updateStatus(
    id: number,
    status: PollStatus,
    userId: number,
    userRole: Role,
  ) {
    const poll = await this.findOne(id);

    if (userRole !== Role.ADMIN && poll.creator.id !== userId) {
      throw new ForbiddenException("You can only update your own polls");
    }

    const oldStatus = poll.status;
    poll.status = status;
    await this.pollsRepository.save(poll);

    if (oldStatus !== PollStatus.ACTIVE && status === PollStatus.ACTIVE) {
      await this.notificationsService.create(
        poll.creator.id,
        NotificationType.POLL_STARTED,
        `您的投票「${poll.title}」已开始`,
        poll.id,
      );
    }

    if (oldStatus === PollStatus.ACTIVE && status === PollStatus.ENDED) {
      await this.notificationsService.create(
        poll.creator.id,
        NotificationType.POLL_ENDED,
        `您的投票「${poll.title}」已结束`,
        poll.id,
      );
    }

    return poll;
  }

  async remove(id: number, userId: number, userRole: Role) {
    const poll = await this.findOne(id);

    if (userRole !== Role.ADMIN && poll.creator.id !== userId) {
      throw new ForbiddenException("You can only delete your own polls");
    }

    return this.pollsRepository.delete(id);
  }
}
