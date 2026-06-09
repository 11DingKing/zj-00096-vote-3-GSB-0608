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

interface RatingRow {
  optionId: number;
  cnt: string | number;
  rcnt: string | number | null;
  rsum: string | number | null;
}

/**
 * 评分投票：按 option 分组对 ratingValue（非 NULL）做 SUM/COUNT，得到 avgRating。
 * 注意保留与原实现一致的语义：
 *   - count 仍为该 option 的投票总数；
 *   - 平均分仅在 ratingValue 非空（且为 truthy）的子集上计算。
 *   - 与原代码 `ratings.filter(v => v.ratingValue)` 行为一致：
 *     SQL 中 ratingValue IS NOT NULL AND ratingValue <> 0 同样会过滤掉 NULL 与 0。
 */
export class RatingScoreStrategy implements ScoreStrategy {
  async calculate(
    poll: Poll,
    votesRepo: Repository<Vote>,
  ): Promise<ScoreStrategyResult> {
    const rows = await votesRepo
      .createQueryBuilder("v")
      .select("v.optionId", "optionId")
      .addSelect("COUNT(*)", "cnt")
      .addSelect(
        "SUM(CASE WHEN v.ratingValue IS NOT NULL AND v.ratingValue <> 0 THEN 1 ELSE 0 END)",
        "rcnt",
      )
      .addSelect(
        "SUM(CASE WHEN v.ratingValue IS NOT NULL AND v.ratingValue <> 0 THEN v.ratingValue ELSE 0 END)",
        "rsum",
      )
      .where("v.pollId = :pid", { pid: poll.id })
      .groupBy("v.optionId")
      .getRawMany<RatingRow>();

    const map = new Map<
      number,
      { count: number; rcnt: number; rsum: number }
    >();
    let totalVotes = 0;
    for (const r of rows) {
      const c = Number(r.cnt) || 0;
      const rcnt = Number(r.rcnt) || 0;
      const rsum = Number(r.rsum) || 0;
      map.set(Number(r.optionId), { count: c, rcnt, rsum });
      totalVotes += c;
    }

    const results: OptionScoreResult[] = poll.options.map((o) => {
      const r = makeBaseResult(o.id, o.name);
      const agg = map.get(o.id);
      if (agg) {
        r.count = agg.count;
        const avg = agg.rcnt > 0 ? agg.rsum / agg.rcnt : 0;
        r.avgRating = Math.round(avg * 100) / 100;
      }
      r.percentage = calcPercentage(r.count, totalVotes);
      return r;
    });

    assignRanks(results, (a, b) => b.avgRating - a.avgRating);
    return { totalVotes, results };
  }
}
