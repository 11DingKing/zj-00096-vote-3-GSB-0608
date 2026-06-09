import { Injectable } from '@nestjs/common';
import { Poll } from '../entities/poll.entity';
import { PollResults } from './poll-score-calculator.interface';
import { BaseCalculatorStrategy } from './base-calculator.strategy';

@Injectable()
export class SingleChoiceCalculatorStrategy extends BaseCalculatorStrategy {
  async calculate(poll: Poll): Promise<PollResults> {
    const totalVotes = await this.getTotalVotes(poll.id);

    const aggregated = await this.votesRepository
      .createQueryBuilder('vote')
      .select('vote.optionId', 'optionId')
      .addSelect('COUNT(*)', 'count')
      .where('vote.pollId = :pollId', { pollId: poll.id })
      .groupBy('vote.optionId')
      .getRawMany();

    const aggregatedMap = new Map<number, { count: number }>();
    for (const row of aggregated) {
      aggregatedMap.set(Number(row.optionId), {
        count: Number(row.count),
      });
    }

    let optionResults = this.buildOptionResults(poll, aggregatedMap, totalVotes);

    optionResults = this.sortAndRank(optionResults, (a, b) => b.count - a.count);

    return this.buildPollResults(poll, totalVotes, optionResults);
  }
}
