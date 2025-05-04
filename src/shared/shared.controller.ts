import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdentifiersService } from '../../src/modules/identifiers/identifiers.service';
import { RecordsService } from '../../src/modules/records/records.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { RecordTypeEnum } from 'src/modules/records/enums/record-type.enum';
import axios from 'axios';

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
      throw new BadRequestException('Name is required');
    }

    const cacheKey = `IMMO_NOSTR:${name}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const ident = await this.identifierService.findOne({
      where: { name },
    });

    if (!ident) {
      throw new NotFoundException('Identifier not found');
    }

    const records = await this.recordService.findAll({
      where: {
        identifierId: ident._id.toString(),
        type: { $in: [RecordTypeEnum.NAMES, RecordTypeEnum.RELAYS] },
      },
    });

    const namespacedRecords = records.reduce(
      (acc, record) => {
        const typeKey = record.type.toLowerCase();
        if (!acc[typeKey]) {
          acc[typeKey] = {};
        }
        acc[typeKey][record.key] = record.value ?? '';
        return acc;
      },
      {} as Record<string, Record<string, string | string[]>>,
    );

    await this.redis.set(cacheKey, JSON.stringify(namespacedRecords), 'EX', 60 * 5); // 5 minutes
    return namespacedRecords;
  }

  @Get('.well-known/lnurlp/')
  async lnResolve(@Query('name') name: string) {
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const cacheKey = `IMMO_LNURL:${name}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const ident = await this.identifierService.findOne({
      where: { name },
    });

    if (!ident) {
      throw new NotFoundException('Identifier not found');
    }

    const record = await this.recordService.findOne({
      where: {
        identifierId: ident._id.toString(),
        type: RecordTypeEnum.LIGHTNING,
      },
    });

    if (!record?.value) {
      throw new NotFoundException('Lightning record not found');
    }

    try {
      const [username, domain] = (record.value as string).split('@');
      if (!username || !domain) {
        throw new Error('Invalid LNURL identifier');
      }

      const lnurlUrl = `https://${domain}/.well-known/lnurlp/${username}`;
      const lnurlRes = await axios.get(lnurlUrl);
      await this.redis.set(cacheKey, JSON.stringify(lnurlRes.data), 'EX', 60 * 5); // 5 minutes
      return lnurlRes.data;
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch LNURL data');
    }
  }
}
