import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from '../entities/poll.entity';
import { Vote } from '../entities/vote.entity';
import { OptionResult, PollResults, PollScoreCalculator } from './poll-score-calculator.interface';

@Injectable()
export abstract class BaseCalculatorStrategy implements PollScoreCalculator {
  @InjectRepository(Vote)
  protected votesRepository: Repository<Vote>;

  abstract calculate(poll: Poll): Promise<PollResults>;

  protected async getTotalVotes(pollId: number): Promise<number> {
    return this.votesRepository.count({
      where: { poll: { id: pollId } },
    });
  }

  protected buildOptionResults(
    poll: Poll,
    aggregatedData: Map<number, { count: number; weightedScore?: number; avgRating?: number; bordaScore?: number }>,
    totalVotes: number,
  ): OptionResult[] {
    return poll.options.map(option => {
      const data = aggregatedData.get(option.id) || { count: 0 };
      const percentage = totalVotes > 0 ? (data.count / totalVotes) * 100 : 0;

      return {
        optionId: option.id,
        optionName: option.name,
        count: data.count,
        percentage: Math.round(percentage * 100) / 100,
        weightedScore: data.weightedScore || 0,
        avgRating: Math.round((data.avgRating || 0) * 100) / 100,
        bordaScore: data.bordaScore || 0,
      };
    });
  }

  protected sortAndRank(results: OptionResult[], compareFn: (a: OptionResult, b: OptionResult) => number): OptionResult[] {
    const sorted = [...results].sort(compareFn);
    sorted.forEach((result, index) => {
      result.rank = index + 1;
    });
    return sorted;
  }

  protected buildPollResults(poll: Poll, totalVotes: number, results: OptionResult[]): PollResults {
    return {
      pollId: poll.id,
      pollTitle: poll.title,
      pollType: poll.type,
      totalVotes,
      results,
    };
  }
}
