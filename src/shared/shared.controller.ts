import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdentifiersService } from '../../src/modules/identifiers/identifiers.service';
import { RecordsService } from '../../src/modules/records/records.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { RecordTypeEnum } from 'src/modules/records/enums/record-type.enum';
import axios from 'axios';
import { Request } from 'express';
import { DomainsService } from 'src/modules/domains/domains.service';

@Controller()
@ApiTags('Shared')
export class SharedController {
  constructor(
    private readonly identifierService: IdentifiersService,
    private readonly domainService: DomainsService,
    private readonly recordService: RecordsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Get('.well-known/nostr.json')
  async resolve(@Query('name') name: string, @Req() req: Request) {
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
    const domain = host?.split(':')[0];

    const cacheKey = `IMMO_NOSTR:${domain + '/' + name}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const dm = await this.domainService.findOne({
      where: {
        domain,
      },
    });

    const ident = await this.identifierService.findOne({
      where: { name, domainId: dm._id },
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

  @Get('.well-known/lnurlp/:name')
  async lnResolve(@Param('name') name: string, @Req() req: Request) {
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const rawHost = (req.headers['x-forwarded-host'] as string) || req.get('host');
    const domainName = rawHost?.split(':')[0];

    if (!domainName) {
      throw new BadRequestException('Unable to determine request domain');
    }

    const domain = await this.domainService.findOne({ where: { domain: domainName } });

    if (!domain) {
      throw new NotFoundException('Domain not recognized');
    }

    const cacheKey = `IMMO_LNURL:${domainName}/${name}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const ident = await this.identifierService.findOne({
      where: { name, domainId: domain._id },
    });

    if (!ident) {
      throw new NotFoundException('Identifier not found for this domain');
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
