import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateIdentifierDto } from "../identifiers/dto/create-identifier.dto";
import { MongoFindManyOptions } from "typeorm/find-options/mongodb/MongoFindManyOptions";
import { MongoFindOneOptions } from "typeorm/find-options/mongodb/MongoFindOneOptions";
import { UpdateIdentifierDto } from "../identifiers/dto/update-identifier.dto";
import { RecordRepository } from "./record.repository";
import { RecordEntity } from "./entities/record.entity";

@Injectable()
export class RecordsService {
  constructor(private readonly repo: RecordRepository) {}

  create(arg: CreateIdentifierDto) {
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

  async update(id: string, arg: UpdateIdentifierDto) {
    const d = await this.findOne({ where: { _id: id } });

    d.assign(arg);

    return this.repo.save(d);
  }
}
