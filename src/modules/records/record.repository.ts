import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { MongoRepository } from 'typeorm';

import { AbstractRepository } from 'src/common/abstract.repository';
import { RecordEntity } from './entities/record.entity';

@Injectable()
export class RecordRepository extends AbstractRepository<RecordEntity> {
  constructor(
    @InjectRepository(RecordEntity)
    readonly repository: MongoRepository<RecordEntity>,
  ) {
    super(repository);
  }
}
