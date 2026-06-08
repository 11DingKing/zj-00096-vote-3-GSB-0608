import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Poll } from '../../polls/entities/poll.entity';
import { Vote } from '../../polls/entities/vote.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: Role,
    default: Role.VOTER,
  })
  role: Role;

  @Column({ default: 1 })
  weight: number;

  @OneToMany(() => Poll, poll => poll.creator)
  polls: Poll[];

  @OneToMany(() => Vote, vote => vote.user)
  votes: Vote[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;
}
