import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PollsService } from "./polls.service";
import { PollsController } from "./polls.controller";
import { Poll } from "./entities/poll.entity";
import { Option } from "./entities/option.entity";
import { Vote } from "./entities/vote.entity";
import { User } from "../users/entities/user.entity";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CountScoringStrategy } from "./strategies/count.scoring";
import { WeightedScoringStrategy } from "./strategies/weighted.scoring";
import { RatingScoringStrategy } from "./strategies/rating.scoring";
import { RankingScoringStrategy } from "./strategies/ranking.scoring";

@Module({
  imports: [
    TypeOrmModule.forFeature([Poll, Option, Vote, User]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [PollsController],
  providers: [
    PollsService,
    CountScoringStrategy,
    WeightedScoringStrategy,
    RatingScoringStrategy,
    RankingScoringStrategy,
  ],
})
export class PollsModule {}
