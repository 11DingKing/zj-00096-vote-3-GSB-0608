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
import { CalculatorFactoryService } from "./strategies/calculator-factory.service";
import { SingleChoiceCalculatorStrategy } from "./strategies/single-choice-calculator.strategy";
import { WeightedCalculatorStrategy } from "./strategies/weighted-calculator.strategy";
import { RatingCalculatorStrategy } from "./strategies/rating-calculator.strategy";
import { RankingCalculatorStrategy } from "./strategies/ranking-calculator.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([Poll, Option, Vote, User]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [PollsController],
  providers: [
    PollsService,
    CalculatorFactoryService,
    SingleChoiceCalculatorStrategy,
    WeightedCalculatorStrategy,
    RatingCalculatorStrategy,
    RankingCalculatorStrategy,
  ],
})
export class PollsModule {}
