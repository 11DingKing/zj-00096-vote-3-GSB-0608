import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Option } from "../entities/option.entity";
import { AbstractScoringStrategy } from "./abstract.scoring";
import { OptionResult, RawOptionScore } from "./scoring-strategy.interface";

@Injectable()
export class RankingScoringStrategy extends AbstractScoringStrategy {
  constructor(@InjectRepository(Option) optionsRepository: Repository<Option>) {
    super(optionsRepository);
  }

  protected getExtraSelects(_pollId: number, optionCount: number): string[] {
    const n = optionCount;
    return [
      `COALESCE(SUM(${n} + 1 - COALESCE(NULLIF(v.rankValue, 0), ${n})), 0) AS bordaScore`,
    ];
  }

  protected hydrate(raw: Record<string, unknown>): RawOptionScore {
    return {
      ...this.hydrateDefaults(raw),
      bordaScore: Number(raw.bordaScore || 0),
    };
  }

  sort(results: OptionResult[]): void {
    results.sort((a, b) => b.bordaScore - a.bordaScore);
  }
}
