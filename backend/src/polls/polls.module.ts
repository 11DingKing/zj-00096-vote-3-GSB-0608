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
import { SingleChoiceCalculator } from "./calculators/single-choice.calculator";
import { WeightedCalculator } from "./calculators/weighted.calculator";
import { RatingCalculator } from "./calculators/rating.calculator";
import { RankingCalculator } from "./calculators/ranking.calculator";

@Module({
  imports: [
    TypeOrmModule.forFeature([Poll, Option, Vote, User]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [PollsController],
  providers: [
    PollsService,
    SingleChoiceCalculator,
    WeightedCalculator,
    RatingCalculator,
    RankingCalculator,
  ],
})
export class PollsModule {}
