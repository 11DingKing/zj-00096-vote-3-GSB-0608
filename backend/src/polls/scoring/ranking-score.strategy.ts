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

interface RankingRow {
  optionId: number;
  cnt: string | number;
  borda: string | number | null;
}

/**
 * 排名投票（Borda 计分）：
 *   每条投票记录的得分 = (N - rank + 1)，其中 rank = COALESCE(rankValue, N)，N = 选项总数。
 *   下推 SQL：SUM(N - COALESCE(rankValue, N) + 1)。
 *   与原实现完全一致。
 */
export class RankingScoreStrategy implements ScoreStrategy {
  async calculate(
    poll: Poll,
    votesRepo: Repository<Vote>,
  ): Promise<ScoreStrategyResult> {
    const n = poll.options.length;

    const rows = await votesRepo
      .createQueryBuilder("v")
      .select("v.optionId", "optionId")
      .addSelect("COUNT(*)", "cnt")
      .addSelect("SUM(:n - COALESCE(v.rankValue, :n) + 1)", "borda")
      .where("v.pollId = :pid", { pid: poll.id })
      .setParameter("n", n)
      .groupBy("v.optionId")
      .getRawMany<RankingRow>();

    const map = new Map<number, { count: number; borda: number }>();
    let totalVotes = 0;
    for (const r of rows) {
      const c = Number(r.cnt) || 0;
      const b = Number(r.borda) || 0;
      map.set(Number(r.optionId), { count: c, borda: b });
      totalVotes += c;
    }

    const results: OptionScoreResult[] = poll.options.map((o) => {
      const r = makeBaseResult(o.id, o.name);
      const agg = map.get(o.id);
      if (agg) {
        r.count = agg.count;
        r.bordaScore = agg.borda;
      }
      r.percentage = calcPercentage(r.count, totalVotes);
      return r;
    });

    assignRanks(results, (a, b) => b.bordaScore - a.bordaScore);
    return { totalVotes, results };
  }
}
