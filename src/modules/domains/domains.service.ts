import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { DomainRepository } from './domain.repository';
import { MongoFindOneOptions } from 'typeorm/find-options/mongodb/MongoFindOneOptions';
import { DomainEntity } from './entities/domain.entity';
import { MongoFindManyOptions } from 'typeorm/find-options/mongodb/MongoFindManyOptions';
import { ObjectId } from 'mongodb';
@Injectable()
export class DomainsService {
  constructor(private readonly repo: DomainRepository) {}

  create(createDomainDto: CreateDomainDto) {
    // const isExist = await this
    const d = this.repo.create(createDomainDto);
    return this.repo.save(d);
  }

  findAll(args: MongoFindManyOptions<DomainEntity> | undefined) {
    return this.repo.findAll(args);
  }

  async findOne(args: MongoFindOneOptions<DomainEntity>) {
    const d = await this.repo.findOne(args);

    if (!d) {
      throw new NotFoundException('domain not found');
    }

    return d;
  }

  async update(id: string, updateDomainDto: UpdateDomainDto) {
    const d = await this.findOne({ where: { _id: new ObjectId(id) } });

    d.assign(updateDomainDto);

    return this.repo.save(d);
  }
}
