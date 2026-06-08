import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Poll } from '../polls/entities/poll.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../common/enums/notification-type.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Poll)
    private pollsRepository: Repository<Poll>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async create(pollId: number, createCommentDto: CreateCommentDto, userId: number) {
    const poll = await this.pollsRepository.findOne({ where: { id: pollId }, relations: ['creator'] });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });

    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      poll,
      user,
    });

    const savedComment = await this.commentsRepository.save(comment);

    if (poll.creator.id !== userId) {
      await this.notificationsService.create(
        poll.creator.id,
        NotificationType.NEW_COMMENT,
        `您的投票「${poll.title}」收到了新评论`,
        poll.id,
      );
    }

    return savedComment;
  }

  async findAllByPollId(pollId: number, page: number = 1, limit: number = 20) {
    const [comments, total] = await this.commentsRepository.findAndCount({
      where: { poll: { id: pollId } },
      relations: ['user'],
      select: {
        user: { id: true, name: true },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async like(id: number) {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.likeCount += 1;
    return this.commentsRepository.save(comment);
  }
}
