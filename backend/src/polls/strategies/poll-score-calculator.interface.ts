import { Poll } from '../entities/poll.entity';

export interface OptionResult {
  optionId: number;
  optionName: string;
  count: number;
  percentage: number;
  weightedScore: number;
  avgRating: number;
  bordaScore: number;
  rank?: number;
}

export interface PollResults {
  pollId: number;
  pollTitle: string;
  pollType: string;
  totalVotes: number;
  results: OptionResult[];
}

export interface PollScoreCalculator {
  calculate(poll: Poll): Promise<PollResults>;
}
