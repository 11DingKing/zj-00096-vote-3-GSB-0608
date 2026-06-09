import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Option } from "../entities/option.entity";
import { AbstractScoringStrategy } from "./abstract.scoring";
import { OptionResult, RawOptionScore } from "./scoring-strategy.interface";

@Injectable()
export class CountScoringStrategy extends AbstractScoringStrategy {
  constructor(@InjectRepository(Option) optionsRepository: Repository<Option>) {
    super(optionsRepository);
  }

  protected getExtraSelects(): string[] {
    return [];
  }

  protected hydrate(raw: Record<string, unknown>): RawOptionScore {
    return this.hydrateDefaults(raw);
  }

  sort(results: OptionResult[]): void {
    results.sort((a, b) => b.count - a.count);
  }
}
