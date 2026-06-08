import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Response } from 'express';
import { Parser } from 'json2csv';
import { Poll } from './entities/poll.entity';
import { Option } from './entities/option.entity';
import { Vote } from './entities/vote.entity';
import { User } from '../users/entities/user.entity';
import { CreatePollDto } from './dto/create-poll.dto';
import { VoteDto } from './dto/vote.dto';
import { PollStatus } from '../common/enums/poll-status.enum';
import { PollType } from '../common/enums/poll-type.enum';
import { Role } from '../common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../common/enums/notification-type.enum';

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
  ) {}

  async create(createPollDto: CreatePollDto, userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    const options = createPollDto.options.map(opt => {
      const option = new Option();
      option.name = opt.name;
      option.description = opt.description;
      option.imageUrl = opt.imageUrl;
      return option;
    });

    const poll = this.pollsRepository.create({
      ...createPollDto,
      startTime: createPollDto.startTime ? new Date(createPollDto.startTime) : null,
      endTime: createPollDto.endTime ? new Date(createPollDto.endTime) : null,
      options,
      creator: user,
      status: PollStatus.ACTIVE,
    });

    return this.pollsRepository.save(poll);
  }

  findAll() {
    return this.pollsRepository.find({
      relations: ['options', 'creator'],
      select: {
        creator: { id: true, name: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: ['options', 'creator', 'votes', 'votes.user', 'votes.option'],
    });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }
    return poll;
  }

  async getResults(id: number) {
    const poll = await this.findOne(id);
    const votes = await this.votesRepository.find({
      where: { poll: { id } },
      relations: ['option', 'user'],
    });

    const totalVotes = votes.length;
    const optionResults = poll.options.map(option => {
      const optionVotes = votes.filter(v => v.option?.id === option.id);
      const count = optionVotes.length;
      const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
      
      let weightedScore = 0;
      let avgRating = 0;
      let bordaScore = 0;

      if (poll.type === PollType.WEIGHTED) {
        weightedScore = optionVotes.reduce((sum, v) => sum + v.weight, 0);
      }
      if (poll.type === PollType.RATING) {
        const ratings = optionVotes.filter(v => v.ratingValue);
        avgRating = ratings.length > 0 
          ? ratings.reduce((sum, v) => sum + v.ratingValue, 0) / ratings.length 
          : 0;
      }
      if (poll.type === PollType.RANKING) {
        bordaScore = optionVotes.reduce((sum, v) => {
          const rank = v.rankValue || poll.options.length;
          return sum + (poll.options.length - rank + 1);
        }, 0);
      }

      return {
        optionId: option.id,
        optionName: option.name,
        count,
        percentage: Math.round(percentage * 100) / 100,
        weightedScore,
        avgRating: Math.round(avgRating * 100) / 100,
        bordaScore,
      };
    });

    optionResults.sort((a, b) => {
      if (poll.type === PollType.WEIGHTED) return b.weightedScore - a.weightedScore;
      if (poll.type === PollType.RATING) return b.avgRating - a.avgRating;
      if (poll.type === PollType.RANKING) return b.bordaScore - a.bordaScore;
      return b.count - a.count;
    });

    optionResults.forEach((result, index) => {
      result['rank'] = index + 1;
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
    const poll = await this.findOne(id);

    if (poll.status !== PollStatus.ACTIVE) {
      throw new BadRequestException('Poll is not active');
    }

    const now = new Date();
    if (poll.endTime && now > new Date(poll.endTime)) {
      throw new BadRequestException('Poll has ended');
    }

    const isAnonymous = poll.isAnonymous;
    const user = userId ? await this.usersRepository.findOne({ where: { id: userId } }) : null;

    if (!isAnonymous && !user) {
      throw new ForbiddenException('Authentication required');
    }

    const existingVotes = await this.votesRepository.find({
      where: isAnonymous
        ? { poll: { id }, browserFingerprint: voteDto.browserFingerprint, ipAddress: ip }
        : { poll: { id }, user: { id: userId } },
    });

    if (existingVotes.length >= poll.maxVotesPerUser) {
      throw new ConflictException('You have already voted');
    }

    const optionIds = poll.options.map(o => o.id);
    for (const v of voteDto.votes) {
      if (!optionIds.includes(v.optionId)) {
        throw new BadRequestException(`Invalid option id: ${v.optionId}`);
      }
    }

    const savedVotes = [];
    for (const v of voteDto.votes) {
      const option = await this.optionsRepository.findOne({ where: { id: v.optionId } });
      const vote = this.votesRepository.create({
        poll,
        option,
        user: isAnonymous ? null : user,
        browserFingerprint: isAnonymous ? voteDto.browserFingerprint : null,
        ipAddress: ip,
        rankValue: v.rankValue,
        ratingValue: v.ratingValue,
        weight: user?.weight || 1,
      });
      savedVotes.push(await this.votesRepository.save(vote));
    }

    return savedVotes;
  }

  async hasVoted(id: number, userId: number | null, browserFingerprint: string, ip: string) {
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
      relations: ['option', 'user'],
    });

    if (includeDetails) {
      const data = votes.map(v => ({
        votedAt: v.votedAt,
        user: v.user?.name || 'Anonymous',
        option: v.option?.name,
        rankValue: v.rankValue || '',
        ratingValue: v.ratingValue || '',
        weight: v.weight,
        ip: v.ipAddress,
      }));

      const parser = new Parser();
      const csv = parser.parse(data);

      res.header('Content-Type', 'text/csv');
      res.attachment(`poll-${id}-details.csv`);
      return res.send(csv);
    }

    const results = await this.getResults(id);
    const parser = new Parser();
    const csv = parser.parse(results.results);

    res.header('Content-Type', 'text/csv');
    res.attachment(`poll-${id}-summary.csv`);
    return res.send(csv);
  }

  async updateStatus(id: number, status: PollStatus, userId: number, userRole: Role) {
    const poll = await this.findOne(id);

    if (userRole !== Role.ADMIN && poll.creator.id !== userId) {
      throw new ForbiddenException('You can only update your own polls');
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
      throw new ForbiddenException('You can only delete your own polls');
    }

    return this.pollsRepository.delete(id);
  }
}
