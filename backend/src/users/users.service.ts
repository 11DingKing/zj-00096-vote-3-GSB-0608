import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepository.find({
      select: ['id', 'username', 'name', 'role', 'weight', 'createdAt'],
    });
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'username', 'name', 'role', 'weight', 'createdAt'],
    });
  }
}
