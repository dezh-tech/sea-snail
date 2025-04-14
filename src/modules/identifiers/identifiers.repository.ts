import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { MongoRepository } from 'typeorm';

import { AbstractRepository } from '../../common/abstract.repository';
import { identifiersEntity } from './entities/identifier.entity';

@Injectable()
export class identifierRepository extends AbstractRepository<identifiersEntity> {
  constructor(
    @InjectRepository(identifiersEntity)
    readonly repository: MongoRepository<identifiersEntity>,
  ) {
    super(repository);
  }
}
