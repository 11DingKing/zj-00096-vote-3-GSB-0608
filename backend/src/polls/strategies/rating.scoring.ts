import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Option } from "../entities/option.entity";
import { AbstractScoringStrategy } from "./abstract.scoring";
import { OptionResult, RawOptionScore } from "./scoring-strategy.interface";

@Injectable()
export class RatingScoringStrategy extends AbstractScoringStrategy {
  constructor(@InjectRepository(Option) optionsRepository: Repository<Option>) {
    super(optionsRepository);
  }

  protected getExtraSelects(): string[] {
    return [
      "COALESCE(AVG(CASE WHEN v.ratingValue IS NOT NULL AND v.ratingValue != 0 THEN v.ratingValue END), 0) AS avgRating",
    ];
  }

  protected hydrate(raw: Record<string, unknown>): RawOptionScore {
    return {
      ...this.hydrateDefaults(raw),
      avgRating: Number(raw.avgRating || 0),
    };
  }

  sort(results: OptionResult[]): void {
    results.sort((a, b) => b.avgRating - a.avgRating);
  }
}
