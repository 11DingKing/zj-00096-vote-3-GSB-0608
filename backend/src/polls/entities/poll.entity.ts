import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { PollType } from '../../common/enums/poll-type.enum';
import { PollStatus } from '../../common/enums/poll-status.enum';
import { User } from '../../users/entities/user.entity';
import { Option } from './option.entity';
import { Vote } from './vote.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity()
export class Poll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: PollType,
  })
  type: PollType;

  @OneToMany(() => Option, option => option.poll, { cascade: true })
  options: Option[];

  @Column({ type: 'datetime', nullable: true })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true })
  endTime: Date;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: 1 })
  maxVotesPerUser: number;

  @Column({
    type: 'simple-enum',
    enum: PollStatus,
    default: PollStatus.DRAFT,
  })
  status: PollStatus;

  @ManyToOne(() => User, user => user.polls)
  creator: User;

  @OneToMany(() => Vote, vote => vote.poll)
  votes: Vote[];

  @OneToMany(() => Comment, comment => comment.poll)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;
}
