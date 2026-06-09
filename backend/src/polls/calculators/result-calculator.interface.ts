import { Option } from "../entities/option.entity";

export interface OptionResult {
  optionId: number;
  optionName: string;
  count: number;
  percentage: number;
  weightedScore: number;
  avgRating: number;
  bordaScore: number;
  rank: number;
}

export interface ResultCalculator {
  calculate(pollId: number, options: Option[]): Promise<OptionResult[]>;
}
