import { Injectable } from '@nestjs/common';
import { Poll } from '../entities/poll.entity';
import { PollResults } from './poll-score-calculator.interface';
import { BaseCalculatorStrategy } from './base-calculator.strategy';

@Injectable()
export class RankingCalculatorStrategy extends BaseCalculatorStrategy {
  async calculate(poll: Poll): Promise<PollResults> {
    const totalVotes = await this.getTotalVotes(poll.id);
    const optionCount = poll.options.length;

    const aggregated = await this.votesRepository
      .createQueryBuilder('vote')
      .select('vote.optionId', 'optionId')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        `SUM(${optionCount} - COALESCE(vote.rankValue, ${optionCount}) + 1)`,
        'bordaScore',
      )
      .where('vote.pollId = :pollId', { pollId: poll.id })
      .groupBy('vote.optionId')
      .getRawMany();

    const aggregatedMap = new Map<number, { count: number; bordaScore: number }>();
    for (const row of aggregated) {
      aggregatedMap.set(Number(row.optionId), {
        count: Number(row.count),
        bordaScore: Number(row.bordaScore),
      });
    }

    let optionResults = this.buildOptionResults(poll, aggregatedMap, totalVotes);

    optionResults = this.sortAndRank(optionResults, (a, b) => b.bordaScore - a.bordaScore);

    return this.buildPollResults(poll, totalVotes, optionResults);
  }
}
