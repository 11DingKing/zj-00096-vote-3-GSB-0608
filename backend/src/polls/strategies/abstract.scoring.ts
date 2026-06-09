import { Repository } from "typeorm";
import { Option } from "../entities/option.entity";
import {
  OptionResult,
  RawOptionScore,
  ScoringStrategy,
} from "./scoring-strategy.interface";

export abstract class AbstractScoringStrategy implements ScoringStrategy {
  constructor(protected readonly optionsRepository: Repository<Option>) {}

  protected abstract getExtraSelects(
    pollId: number,
    optionCount: number,
  ): string[];

  abstract sort(results: OptionResult[]): void;

  protected hydrateDefaults(raw: Record<string, unknown>): RawOptionScore {
    return {
      optionId: Number(raw.optionId),
      optionName: String(raw.optionName),
      count: Number(raw.count || 0),
    };
  }

  protected round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  async compute(pollId: number, optionCount: number) {
    const qb = this.optionsRepository
      .createQueryBuilder("o")
      .leftJoin("o.votes", "v", "v.pollId = :pollId", { pollId })
      .where("o.pollId = :pollId", { pollId })
      .groupBy("o.id")
      .addGroupBy("o.name")
      .select("o.id", "optionId")
      .addSelect("o.name", "optionName")
      .addSelect("COUNT(v.id)", "count");

    for (const sel of this.getExtraSelects(pollId, optionCount)) {
      qb.addSelect(sel);
    }

    const rows = await qb.getRawMany();
    const results = rows.map((r) => this.hydrate(r));
    const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
    return { totalVotes, results };
  }

  protected abstract hydrate(raw: Record<string, unknown>): RawOptionScore;

  toOptionResult(raw: RawOptionScore, totalVotes: number): OptionResult {
    return {
      optionId: raw.optionId,
      optionName: raw.optionName,
      count: raw.count,
      percentage: this.round2(
        totalVotes > 0 ? (raw.count / totalVotes) * 100 : 0,
      ),
      weightedScore: raw.weightedScore ?? 0,
      avgRating: this.round2(raw.avgRating ?? 0),
      bordaScore: raw.bordaScore ?? 0,
    };
  }
}
