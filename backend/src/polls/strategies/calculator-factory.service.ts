import { Injectable } from '@nestjs/common';
import { PollType } from '../../common/enums/poll-type.enum';
import { PollScoreCalculator } from './poll-score-calculator.interface';
import { SingleChoiceCalculatorStrategy } from './single-choice-calculator.strategy';
import { WeightedCalculatorStrategy } from './weighted-calculator.strategy';
import { RatingCalculatorStrategy } from './rating-calculator.strategy';
import { RankingCalculatorStrategy } from './ranking-calculator.strategy';

@Injectable()
export class CalculatorFactoryService {
  private strategies: Map<PollType, PollScoreCalculator>;

  constructor(
    private singleChoiceCalculator: SingleChoiceCalculatorStrategy,
    private weightedCalculator: WeightedCalculatorStrategy,
    private ratingCalculator: RatingCalculatorStrategy,
    private rankingCalculator: RankingCalculatorStrategy,
  ) {
    this.strategies = new Map();
    this.strategies.set(PollType.SINGLE_CHOICE, singleChoiceCalculator);
    this.strategies.set(PollType.MULTIPLE_CHOICE, singleChoiceCalculator);
    this.strategies.set(PollType.WEIGHTED, weightedCalculator);
    this.strategies.set(PollType.RATING, ratingCalculator);
    this.strategies.set(PollType.RANKING, rankingCalculator);
  }

  getCalculator(type: PollType): PollScoreCalculator {
    const calculator = this.strategies.get(type);
    if (!calculator) {
      throw new Error(`No calculator found for poll type: ${type}`);
    }
    return calculator;
  }
}
