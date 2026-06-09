import { Repository } from "typeorm";
import { Poll } from "../entities/poll.entity";
import { Vote } from "../entities/vote.entity";
import {
  ScoreStrategy,
  ScoreStrategyResult,
  OptionScoreResult,
  makeBaseResult,
  calcPercentage,
  assignRanks,
} from "./score-strategy.interface";

interface WeightedRow {
  optionId: number;
  cnt: string | number;
  wsum: string | number | null;
}

/**
 * 加权投票：按 option 分组求 sum(weight)；排序按 weightedScore 倒序。
 */
export class WeightedScoreStrategy implements ScoreStrategy {
  async calculate(
    poll: Poll,
    votesRepo: Repository<Vote>,
  ): Promise<ScoreStrategyResult> {
    const rows = await votesRepo
      .createQueryBuilder("v")
      .select("v.optionId", "optionId")
      .addSelect("COUNT(*)", "cnt")
      .addSelect("SUM(v.weight)", "wsum")
      .where("v.pollId = :pid", { pid: poll.id })
      .groupBy("v.optionId")
      .getRawMany<WeightedRow>();

    const map = new Map<number, { count: number; weighted: number }>();
    let totalVotes = 0;
    for (const r of rows) {
      const c = Number(r.cnt) || 0;
      const w = Number(r.wsum) || 0;
      map.set(Number(r.optionId), { count: c, weighted: w });
      totalVotes += c;
    }

    const results: OptionScoreResult[] = poll.options.map((o) => {
      const r = makeBaseResult(o.id, o.name);
      const agg = map.get(o.id);
      if (agg) {
        r.count = agg.count;
        r.weightedScore = agg.weighted;
      }
      r.percentage = calcPercentage(r.count, totalVotes);
      return r;
    });

    assignRanks(results, (a, b) => b.weightedScore - a.weightedScore);
    return { totalVotes, results };
  }
}
