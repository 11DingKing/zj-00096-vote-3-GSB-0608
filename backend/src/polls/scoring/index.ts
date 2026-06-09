import { PollType } from "../../common/enums/poll-type.enum";
import { ScoreStrategy } from "./score-strategy.interface";
import { CountScoreStrategy } from "./count-score.strategy";
import { WeightedScoreStrategy } from "./weighted-score.strategy";
import { RatingScoreStrategy } from "./rating-score.strategy";
import { RankingScoreStrategy } from "./ranking-score.strategy";

/**
 * 类型 -> 策略 的注册表。
 * getResults 仅按类型查表分发，不再出现 if/switch 业务判断。
 */
export const SCORE_STRATEGIES: Record<PollType, ScoreStrategy> = {
  [PollType.SINGLE_CHOICE]: new CountScoreStrategy(),
  [PollType.MULTIPLE_CHOICE]: new CountScoreStrategy(),
  [PollType.WEIGHTED]: new WeightedScoreStrategy(),
  [PollType.RATING]: new RatingScoreStrategy(),
  [PollType.RANKING]: new RankingScoreStrategy(),
};
