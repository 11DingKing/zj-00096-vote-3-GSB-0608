import { Injectable } from '@nestjs/common';
import { Poll } from '../entities/poll.entity';
import { PollResults } from './poll-score-calculator.interface';
import { BaseCalculatorStrategy } from './base-calculator.strategy';

@Injectable()
export class RatingCalculatorStrategy extends BaseCalculatorStrategy {
  async calculate(poll: Poll): Promise<PollResults> {
    const totalVotes = await this.getTotalVotes(poll.id);

    const aggregated = await this.votesRepository
      .createQueryBuilder('vote')
      .select('vote.optionId', 'optionId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COUNT(vote.ratingValue)', 'ratingCount')
      .addSelect('SUM(vote.ratingValue)', 'ratingSum')
      .where('vote.pollId = :pollId', { pollId: poll.id })
      .groupBy('vote.optionId')
      .getRawMany();

    const aggregatedMap = new Map<number, { count: number; avgRating: number }>();
    for (const row of aggregated) {
      const ratingCount = Number(row.ratingCount);
      const ratingSum = Number(row.ratingSum);
      const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

      aggregatedMap.set(Number(row.optionId), {
        count: Number(row.count),
        avgRating,
      });
    }

    let optionResults = this.buildOptionResults(poll, aggregatedMap, totalVotes);

    optionResults = this.sortAndRank(optionResults, (a, b) => b.avgRating - a.avgRating);

    return this.buildPollResults(poll, totalVotes, optionResults);
  }
}
