import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vote } from "../entities/vote.entity";
import { Option } from "../entities/option.entity";
import { ResultCalculator, OptionResult } from "./result-calculator.interface";

@Injectable()
export class RankingCalculator implements ResultCalculator {
  constructor(
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
  ) {}

  async calculate(pollId: number, options: Option[]): Promise<OptionResult[]> {
    const optionsCount = options.length;
    const rawResults = await this.votesRepository
      .createQueryBuilder("vote")
      .select("vote.optionId", "optionId")
      .addSelect("COUNT(*)", "count")
      .addSelect(
        `SUM(${optionsCount} - COALESCE(NULLIF(vote.rankValue, 0), ${optionsCount}) + 1)`,
        "bordaScore",
      )
      .where("vote.pollId = :pollId", { pollId })
      .groupBy("vote.optionId")
      .getRawMany();

    const dataMap = new Map<number, { count: number; bordaScore: number }>();
    let totalVotes = 0;
    for (const row of rawResults) {
      const count = parseInt(row.count, 10) || 0;
      const bordaScore = parseInt(row.bordaScore, 10) || 0;
      dataMap.set(parseInt(row.optionId, 10), { count, bordaScore });
      totalVotes += count;
    }

    const results: OptionResult[] = options.map((option) => {
      const data = dataMap.get(option.id) || { count: 0, bordaScore: 0 };
      const percentage = totalVotes > 0 ? (data.count / totalVotes) * 100 : 0;
      return {
        optionId: option.id,
        optionName: option.name,
        count: data.count,
        percentage: Math.round(percentage * 100) / 100,
        weightedScore: 0,
        avgRating: 0,
        bordaScore: data.bordaScore,
        rank: 0,
      };
    });

    results.sort((a, b) => b.bordaScore - a.bordaScore);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }
}
