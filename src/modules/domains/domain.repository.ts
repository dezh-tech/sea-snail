import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { MongoRepository } from 'typeorm';

import { AbstractRepository } from '../../common/abstract.repository';
import { DomainEntity } from './entities/domain.entity';

@Injectable()
export class DomainRepository extends AbstractRepository<DomainEntity> {
  constructor(
    @InjectRepository(DomainEntity)
    readonly repository: MongoRepository<DomainEntity>,
  ) {
    super(repository);
  }
}
