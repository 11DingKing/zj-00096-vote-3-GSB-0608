import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { PollType } from '../../common/enums/poll-type.enum';

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: PollType,
  })
  type: PollType;

  @Column({ type: 'simple-json' })
  defaultOptions: string[];

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ default: true })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
