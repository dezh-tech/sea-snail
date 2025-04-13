import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { MongoRepository } from 'typeorm';

import { UserEntity } from './entities/user.entity';
import { AbstractRepository } from 'src/common/abstract.repository';

@Injectable()
export class UserRepository extends AbstractRepository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    readonly repository: MongoRepository<UserEntity>,
  ) {
    super(repository);
  }
}
