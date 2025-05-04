import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdentifiersService } from '../../src/modules/identifiers/identifiers.service';
import { RecordsService } from '../../src/modules/records/records.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Controller()
@ApiTags('Shared')
export class SharedController {
  constructor(
    private readonly identifierService: IdentifiersService,
    private readonly recordService: RecordsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Get('.well-known/nostr.json')
  async resolve(@Query('name') name: string) {
    if (!name) {
      return { error: 'Name is required' };
    }

    // const cacheKey = `IMMO_DEV_nostr:${name}`;
    // const cached = await this.redis.get(cacheKey);

    // if (cached) {
    //   return JSON.parse(cached);
    // }

    const ident = await this.identifierService.findOne({
      where: { name },
    });

    if (!ident) {
      return { error: 'Identifier not found' };
    }

    const records = await this.recordService.findAll({
      where: { identifierId: ident._id.toString() },
    });

    const namespacedRecords = records.reduce(
      (acc, record) => {
        if (!acc[record.type]) {
          acc[record.type.toLocaleLowerCase()] = {};
        }
        acc[record.type.toLocaleLowerCase()]![record.key] = record.value ?? '';
        return acc;
      },
      {} as Record<string, Record<string, string | string[]>>,
    );

    // await this.redis.set(cacheKey, JSON.stringify(namespacedRecords), 'EX', 86400);

    return namespacedRecords;
  }

  @Get('.well-known/lnurlp/')
  async lnResolve(@Query('name') _name: string) {
    // ?
  }
}
