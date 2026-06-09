import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vote } from "../entities/vote.entity";
import { Option } from "../entities/option.entity";
import { ResultCalculator, OptionResult } from "./result-calculator.interface";

@Injectable()
export class SingleChoiceCalculator implements ResultCalculator {
  constructor(
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
  ) {}

  async calculate(pollId: number, options: Option[]): Promise<OptionResult[]> {
    const rawResults = await this.votesRepository
      .createQueryBuilder("vote")
      .select("vote.optionId", "optionId")
      .addSelect("COUNT(*)", "count")
      .where("vote.pollId = :pollId", { pollId })
      .groupBy("vote.optionId")
      .getRawMany();

    const countMap = new Map<number, number>();
    let totalVotes = 0;
    for (const row of rawResults) {
      const count = parseInt(row.count, 10) || 0;
      countMap.set(parseInt(row.optionId, 10), count);
      totalVotes += count;
    }

    const results: OptionResult[] = options.map((option) => {
      const count = countMap.get(option.id) || 0;
      const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
      return {
        optionId: option.id,
        optionName: option.name,
        count,
        percentage: Math.round(percentage * 100) / 100,
        weightedScore: 0,
        avgRating: 0,
        bordaScore: 0,
        rank: 0,
      };
    });

    results.sort((a, b) => b.count - a.count);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }
}
