import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vote } from "../entities/vote.entity";
import { Option } from "../entities/option.entity";
import { ResultCalculator, OptionResult } from "./result-calculator.interface";

@Injectable()
export class WeightedCalculator implements ResultCalculator {
  constructor(
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
  ) {}

  async calculate(pollId: number, options: Option[]): Promise<OptionResult[]> {
    const rawResults = await this.votesRepository
      .createQueryBuilder("vote")
      .select("vote.optionId", "optionId")
      .addSelect("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(vote.weight), 0)", "weightedScore")
      .where("vote.pollId = :pollId", { pollId })
      .groupBy("vote.optionId")
      .getRawMany();

    const dataMap = new Map<number, { count: number; weightedScore: number }>();
    let totalVotes = 0;
    for (const row of rawResults) {
      const count = parseInt(row.count, 10) || 0;
      const weightedScore = parseFloat(row.weightedScore) || 0;
      dataMap.set(parseInt(row.optionId, 10), { count, weightedScore });
      totalVotes += count;
    }

    const results: OptionResult[] = options.map((option) => {
      const data = dataMap.get(option.id) || { count: 0, weightedScore: 0 };
      const percentage = totalVotes > 0 ? (data.count / totalVotes) * 100 : 0;
      return {
        optionId: option.id,
        optionName: option.name,
        count: data.count,
        percentage: Math.round(percentage * 100) / 100,
        weightedScore: data.weightedScore,
        avgRating: 0,
        bordaScore: 0,
        rank: 0,
      };
    });

    results.sort((a, b) => b.weightedScore - a.weightedScore);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }
}
