import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoFindOneOptions } from 'typeorm/find-options/mongodb/MongoFindOneOptions';
import { MongoFindManyOptions } from 'typeorm/find-options/mongodb/MongoFindManyOptions';
import { identifierRepository } from './identifiers.repository';
import { CreateIdentifierDto } from './dto/create-identifier.dto';
import { identifiersEntity } from './entities/identifier.entity';
import { UpdateIdentifierDto } from './dto/update-identifier.dto';

@Injectable()
export class IdentifiersService {
  constructor(private readonly repo: identifierRepository) {}

  create(arg: CreateIdentifierDto) {
    const i = this.repo.create(arg);
    return this.repo.save(i);
  }

  findAll(args: MongoFindManyOptions<identifiersEntity> | undefined) {
    return this.repo.findAll(args);
  }

  async findOne(args: MongoFindOneOptions<identifiersEntity>) {
    const d = await this.repo.findOne(args);

    if (!d) {
      throw new NotFoundException('identifier not found');
    }

    return d;
  }

  async update(id: string, arg: UpdateIdentifierDto) {
    const d = await this.findOne({ where: { _id: id } });

    d.assign(arg);

    return this.repo.save(d);
  }
}
