import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoFindManyOptions } from 'typeorm/find-options/mongodb/MongoFindManyOptions';
import { MongoFindOneOptions } from 'typeorm/find-options/mongodb/MongoFindOneOptions';
import { RecordRepository } from './record.repository';
import { RecordEntity } from './entities/record.entity';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordBulkDto, UpdateRecordDto } from './dto/update-record.dto';
import { ObjectId } from 'mongodb';
import { IdentifiersService } from '../identifiers/identifiers.service';
import { identifiersDto } from '../identifiers/dto/identifiers.dto';
import { RecordTypeEnum } from './enums/record-type.enum';
import { isArray } from 'lodash';

@Injectable()
export class RecordsService {
  constructor(
    private readonly repo: RecordRepository,
    private readonly identifierService: IdentifiersService,
  ) {
    this.initializeConfigListener();
  }

  private initializeConfigListener(): void {
    this.identifierService.on('IDENTIFIER_REGISTER', async (arg: identifiersDto) => {
      await this.create({
        identifierId: arg.id.toString(),
        type: RecordTypeEnum.NAMES,
        key: arg.name,
        priority: 0,
        ttl: 0,
        value: arg.userId,
      });

      await this.create({
        identifierId: arg.id.toString(),
        type: RecordTypeEnum.RELAYS,
        key: arg.userId,
        priority: 0,
        ttl: 0,
        value: [],
      });

      await this.create({
        identifierId: arg.id.toString(),
        type: RecordTypeEnum.LIGHTNING,
        key: arg.userId,
        priority: 0,
        ttl: 0,
        value: '',
      });
    });
  }

  create(arg: CreateRecordDto) {
    const i = this.repo.create(arg);
    return this.repo.save(i);
  }

  findAll(args: MongoFindManyOptions<RecordEntity> | undefined) {
    return this.repo.findAll(args);
  }

  async findOne(args: MongoFindOneOptions<RecordEntity>) {
    const d = await this.repo.findOne(args);

    if (!d) {
      throw new NotFoundException('identifier not found');
    }

    return d;
  }

  async update(id: string, arg: UpdateRecordDto) {
    const d = await this.findOne({ where: { _id: new ObjectId(id) } });

    d.assign(arg);

    return this.repo.save(d);
  }

  async updateClient(identifierId: string, arg: UpdateRecordBulkDto) {
    const records = await this.findAll({
      where: {
        identifierId,
        type: { $in: [RecordTypeEnum.LIGHTNING, RecordTypeEnum.NAMES, RecordTypeEnum.RELAYS] },
      },
    });

    for (const record of records) {
      if (record.type === RecordTypeEnum.LIGHTNING && arg.lightning !== undefined) {
        record.value = arg.lightning;
      }

      if (record.type === RecordTypeEnum.NAMES && arg.npub !== undefined) {
        record.value = arg.npub;
      }

      if (record.type === RecordTypeEnum.RELAYS && arg.relays !== undefined) {
        record.value = arg.relays;
      }

      await this.repo.save(record);
    }
  }
}
