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

interface OptionAggRow {
  optionId: number;
  cnt: string | number;
}

/**
 * 单选/多选：按 option 分组计数，按 count 倒序排名。
 */
export class CountScoreStrategy implements ScoreStrategy {
  async calculate(
    poll: Poll,
    votesRepo: Repository<Vote>,
  ): Promise<ScoreStrategyResult> {
    const rows = await votesRepo
      .createQueryBuilder("v")
      .select("v.optionId", "optionId")
      .addSelect("COUNT(*)", "cnt")
      .where("v.pollId = :pid", { pid: poll.id })
      .groupBy("v.optionId")
      .getRawMany<OptionAggRow>();

    const countMap = new Map<number, number>();
    let totalVotes = 0;
    for (const r of rows) {
      const c = Number(r.cnt) || 0;
      countMap.set(Number(r.optionId), c);
      totalVotes += c;
    }

    const results: OptionScoreResult[] = poll.options.map((o) => {
      const r = makeBaseResult(o.id, o.name);
      r.count = countMap.get(o.id) || 0;
      r.percentage = calcPercentage(r.count, totalVotes);
      return r;
    });

    assignRanks(results, (a, b) => b.count - a.count);
    return { totalVotes, results };
  }
}
