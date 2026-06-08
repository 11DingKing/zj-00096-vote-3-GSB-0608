import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Poll } from '../../polls/entities/poll.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  likeCount: number;

  @ManyToOne(() => Poll, poll => poll.comments)
  poll: Poll;

  @ManyToOne(() => User, user => user.comments)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
