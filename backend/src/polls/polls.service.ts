import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, EntityManager } from "typeorm";
import { Response } from "express";
import { Parser } from "json2csv";
import { Poll } from "./entities/poll.entity";
import { Option } from "./entities/option.entity";
import { Vote } from "./entities/vote.entity";
import { User } from "../users/entities/user.entity";
import { CreatePollDto } from "./dto/create-poll.dto";
import { VoteDto } from "./dto/vote.dto";
import { PollStatus } from "../common/enums/poll-status.enum";
import { PollType } from "../common/enums/poll-type.enum";
import { Role } from "../common/enums/role.enum";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../common/enums/notification-type.enum";
import {
  ScoringStrategy,
  OptionResult,
} from "./strategies/scoring-strategy.interface";
import { CountScoringStrategy } from "./strategies/count.scoring";
import { WeightedScoringStrategy } from "./strategies/weighted.scoring";
import { RatingScoringStrategy } from "./strategies/rating.scoring";
import { RankingScoringStrategy } from "./strategies/ranking.scoring";

@Injectable()
export class PollsService {
  private readonly strategyMap: Map<PollType, ScoringStrategy>;

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
    countStrategy: CountScoringStrategy,
    weightedStrategy: WeightedScoringStrategy,
    ratingStrategy: RatingScoringStrategy,
    rankingStrategy: RankingScoringStrategy,
  ) {
    this.strategyMap = new Map<PollType, ScoringStrategy>([
      [PollType.SINGLE_CHOICE, countStrategy],
      [PollType.MULTIPLE_CHOICE, countStrategy],
      [PollType.WEIGHTED, weightedStrategy],
      [PollType.RATING, ratingStrategy],
      [PollType.RANKING, rankingStrategy],
    ]);
  }

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

  private async findPollForLogic(id: number): Promise<Poll> {
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: ["options", "creator"],
    });
    if (!poll) {
      throw new NotFoundException("Poll not found");
    }
    return poll;
  }

  async getResults(id: number) {
    const poll = await this.findPollForLogic(id);
    const strategy = this.strategyMap.get(poll.type);
    if (!strategy) {
      throw new BadRequestException(`Unsupported poll type: ${poll.type}`);
    }

    const { totalVotes, results: rawResults } = await strategy.compute(
      id,
      poll.options.length,
    );

    const optionResults: OptionResult[] = rawResults.map((r) =>
      strategy.toOptionResult(r, totalVotes),
    );

    strategy.sort(optionResults);

    optionResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    return {
      pollId: poll.id,
      pollTitle: poll.title,
      pollType: poll.type,
      totalVotes,
      results: optionResults,
    };
  }

  async vote(id: number, voteDto: VoteDto, userId: number | null, ip: string) {
    const poll = await this.findPollForLogic(id);

    if (poll.status !== PollStatus.ACTIVE) {
      throw new BadRequestException("Poll is not active");
    }

    const now = new Date();
    if (poll.endTime && now > new Date(poll.endTime)) {
      throw new BadRequestException("Poll has ended");
    }

    const isAnonymous = poll.isAnonymous;
    const user = userId
      ? await this.usersRepository.findOne({ where: { id: userId } })
      : null;

    if (!isAnonymous && !user) {
      throw new ForbiddenException("Authentication required");
    }

    const incomingOptionIds = voteDto.votes.map((v) => v.optionId);
    const validOptionIds = new Set(poll.options.map((o) => o.id));
    for (const oid of incomingOptionIds) {
      if (!validOptionIds.has(oid)) {
        throw new BadRequestException(`Invalid option id: ${oid}`);
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const existingCount = await this.countExistingVotes(
        manager,
        id,
        isAnonymous,
        userId,
        voteDto.browserFingerprint,
        ip,
      );

      if (existingCount + voteDto.votes.length > poll.maxVotesPerUser) {
        throw new ConflictException(
          existingCount >= poll.maxVotesPerUser
            ? "You have already voted"
            : `You can only cast up to ${poll.maxVotesPerUser} vote(s) in total`,
        );
      }

      const savedVotes: Vote[] = [];
      for (const v of voteDto.votes) {
        const vote = manager.create(Vote, {
          poll: { id: poll.id } as Poll,
          option: { id: v.optionId } as Option,
          user: isAnonymous ? null : ({ id: user.id } as User),
          browserFingerprint: isAnonymous ? voteDto.browserFingerprint : null,
          ipAddress: ip,
          rankValue: v.rankValue,
          ratingValue: v.ratingValue,
          weight: user?.weight || 1,
        });
        savedVotes.push(await manager.save(vote));
      }

      return savedVotes;
    });
  }

  private async countExistingVotes(
    manager: EntityManager,
    pollId: number,
    isAnonymous: boolean,
    userId: number | null,
    browserFingerprint: string | undefined,
    ip: string,
  ): Promise<number> {
    const where: Record<string, unknown> = { poll: { id: pollId } };
    if (isAnonymous) {
      where.browserFingerprint = browserFingerprint;
      where.ipAddress = ip;
    } else {
      where.user = { id: userId };
    }
    return manager.count(Vote, { where });
  }

  async hasVoted(
    id: number,
    userId: number | null,
    browserFingerprint: string,
    ip: string,
  ) {
    const poll = await this.findPollForLogic(id);

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
