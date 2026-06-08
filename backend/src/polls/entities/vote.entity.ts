import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Poll } from './poll.entity';
import { Option } from './option.entity';

@Entity()
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.votes, { nullable: true })
  user: User;

  @Column({ nullable: true })
  browserFingerprint: string;

  @Column({ nullable: true })
  ipAddress: string;

  @ManyToOne(() => Poll, poll => poll.votes)
  poll: Poll;

  @ManyToOne(() => Option, option => option.votes)
  option: Option;

  @Column({ nullable: true })
  rankValue: number;

  @Column({ nullable: true })
  ratingValue: number;

  @Column({ default: 1 })
  weight: number;

  @CreateDateColumn()
  votedAt: Date;
}
