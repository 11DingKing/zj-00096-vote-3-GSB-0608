import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
  ) {}

  findAll() {
    return this.templatesRepository.find();
  }

  findOne(id: number) {
    return this.templatesRepository.findOne({ where: { id } });
  }
}
