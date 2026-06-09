import { Repository } from 'typeorm';
import { Poll } from '../entities/poll.entity';
import { Vote } from '../entities/vote.entity';

export interface OptionScoreResult {
  optionId: number;
  optionName: string;
  count: number;
  percentage: number;
  weightedScore: number;
  avgRating: number;
  bordaScore: number;
  rank?: number;
}

export interface ScoreStrategyResult {
  totalVotes: number;
  results: OptionScoreResult[];
}

export interface ScoreStrategy {
  calculate(poll: Poll, votesRepo: Repository<Vote>): Promise<ScoreStrategyResult>;
}

export function makeBaseResult(optionId: number, optionName: string): OptionScoreResult {
  return {
    optionId,
    optionName,
    count: 0,
    percentage: 0,
    weightedScore: 0,
    avgRating: 0,
    bordaScore: 0,
  };
}

export function calcPercentage(count: number, total: number): number {
  const p = total > 0 ? (count / total) * 100 : 0;
  return Math.round(p * 100) / 100;
}

export function assignRanks(
  results: OptionScoreResult[],
  cmp: (a: OptionScoreResult, b: OptionScoreResult) => number,
): OptionScoreResult[] {
  results.sort(cmp);
  results.forEach((r, i) => {
    r.rank = i + 1;
  });
  return results;
}
