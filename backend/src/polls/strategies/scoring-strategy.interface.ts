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

export interface RawOptionScore {
  optionId: number;
  optionName: string;
  count: number;
  weightedScore?: number;
  avgRating?: number;
  bordaScore?: number;
}

export interface ScoringStrategy {
  compute(pollId: number, optionCount: number): Promise<{
    totalVotes: number;
    results: RawOptionScore[];
  }>;
  toOptionResult(raw: RawOptionScore, totalVotes: number): OptionResult;
  sort(results: OptionResult[]): void;
}
