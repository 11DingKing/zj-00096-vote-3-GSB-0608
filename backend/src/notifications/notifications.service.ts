import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { NotificationType } from '../common/enums/notification-type.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    userId: number,
    type: NotificationType,
    content: string,
    relatedId?: number,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    const notification = this.notificationsRepository.create({
      user,
      type,
      content,
      relatedId,
    });

    return this.notificationsRepository.save(notification);
  }

  async findAllByUserId(userId: number) {
    return this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount(userId: number) {
    return this.notificationsRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationsRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: number) {
    await this.notificationsRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
  }
}
