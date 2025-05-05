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
import { RecordTypeEnum } from '../../src/modules/records/enums/record-type.enum';
import axios from 'axios';
import { Request } from 'express';
import { DomainsService } from '../../src/modules/domains/domains.service';
import { ApiConfigService } from './services/api-config.service';

@Controller()
@ApiTags('Shared')
export class SharedController {
  constructor(
    private readonly identifierService: IdentifiersService,
    private readonly domainService: DomainsService,
    private readonly recordService: RecordsService,
    private readonly apiConfig : ApiConfigService,
    @InjectRedis() private readonly redis: Redis
  ) {}

  @Get('.well-known/nostr.json')
  async resolve(@Query('name') name: string, @Req() req: Request) {
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
    const domainName = host?.split(':')[0];
    const userAgent = req.headers['user-agent'] ?? 'unknown';

    // Track the client stats in Redis
    const clientStatsKey = `${this.apiConfig.redisPrefixKey}stats:domain:${domainName}:identifier:${name}:clientStats`;
    await this.redis.hincrby(clientStatsKey, userAgent, 1); // Increment the count for this client

    // Track total resolutions for the identifier
    const resolveKey = `${this.apiConfig.redisPrefixKey}stats:domain:${domainName}:identifier:${name}:resolutions`;
    await this.redis.incr(resolveKey);

    const cacheKey = `${this.apiConfig.redisPrefixKey}NOSTR:${domainName + '/' + name}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const dm = await this.domainService.findOne({
        where: {
          domain: domainName,
        },
      });

      const ident = await this.identifierService.findOne({
        where: { name, domainId: dm._id.toString() },
      });

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

      // Track success for this resolution attempt
      const successKey = `${this.apiConfig.redisPrefixKey}stats:domain:${domainName}:identifier:${name}:success`;
      await this.redis.incr(successKey);

      return namespacedRecords;
    } catch (err) {
      // Track failure for this resolution attempt
      const failureKey = `${this.apiConfig.redisPrefixKey}stats:domain:${domainName}:identifier:${name}:failure`;
      await this.redis.incr(failureKey);

      throw new InternalServerErrorException('Failed to resolve identifier');
    }
  }

  @Get('.well-known/lnurlp/:name')
  async lnResolve(@Param('name') name: string, @Req() req: Request) {
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const rawHost = (req.headers['x-forwarded-host'] as string) || req.get('host');
    const domainName = rawHost?.split(':')[0];
    const userAgent = req.headers['user-agent'] ?? 'unknown';

    // Track the client stats in Redis
    const clientStatsKey = `${this.apiConfig.redisPrefixKey}stats:domain:${domainName}:identifier:${name}:clientStats`;
    await this.redis.hincrby(clientStatsKey, userAgent, 1); // Increment the count for this client

    // Track total resolutions for the identifier
    const resolveKey = `${this.apiConfig.redisPrefixKey}stats:domain:${domainName}:identifier:${name}:resolutions`;
    await this.redis.incr(resolveKey);

    const cacheKey = `${this.apiConfig.redisPrefixKey}LNURL:${domainName + '/' + name}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      // Track success for this resolution attempt
      const successKey = `${this.apiConfig.redisPrefixKey}stats:domain:${domainName}:identifier:${name}:success`;
      await this.redis.incr(successKey);

      return JSON.parse(cached);
    }

    try {
      const dm = await this.domainService.findOne({ where: { domain: domainName } });

      if (!dm) {
        throw new NotFoundException('Domain not recognized');
      }

      const ident = await this.identifierService.findOne({
        where: { name, domainId: dm._id.toString() },
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

      const [username, domain] = (record.value as string).split('@');
      if (!username || !domain) {
        throw new Error('Invalid LNURL identifier');
      }

      const lnurlUrl = `https://${domain}/.well-known/lnurlp/${username}`;
      const lnurlRes = await axios.get(lnurlUrl);
      await this.redis.set(cacheKey, JSON.stringify(lnurlRes.data), 'EX', 60 * 5); // 5 minutes

      // Track success for this resolution attempt
      const successKey = `${this.apiConfig.redisPrefixKey}stats:domain:${dm}:identifier:${name}:success`;
      await this.redis.incr(successKey);

      return lnurlRes.data;
    } catch (err) {
      // Track failure for this resolution attempt
      const failureKey = `${this.apiConfig.redisPrefixKey}stats:domain:${domainName}:identifier:${name}:failure`;
      await this.redis.incr(failureKey);

      throw new InternalServerErrorException('Failed to resolve LNURL data');
    }
  }

  @Get('stats/:identifier')
  async getStats(@Param('identifier') identifier: string, @Req() req: Request) {
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
    const domain = host?.split(':')[0];
    const stats = {
      resolutions: await this.redis.get(
        `${this.apiConfig.redisPrefixKey}stats:domain:${domain}:identifier:${identifier}:resolutions`,
      ),
      success: await this.redis.get(`${this.apiConfig.redisPrefixKey}stats:domain:${domain}:identifier:${identifier}:success`),
      failure: await this.redis.get(`${this.apiConfig.redisPrefixKey}stats:domain:${domain}:identifier:${identifier}:failure`),
      clients: await this.redis.hgetall(
        `${this.apiConfig.redisPrefixKey}stats:domain:${domain}:identifier:${identifier}:clientStats`,
      ), // To get all clients
    };
    return stats;
  }
}
