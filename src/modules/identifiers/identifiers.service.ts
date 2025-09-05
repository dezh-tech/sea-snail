import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MongoFindOneOptions } from 'typeorm/find-options/mongodb/MongoFindOneOptions';
import { MongoFindManyOptions } from 'typeorm/find-options/mongodb/MongoFindManyOptions';
import { identifierRepository } from './identifiers.repository';
import { CreateIdentifierDto } from './dto/create-identifier.dto';
import { identifiersEntity } from './entities/identifier.entity';
import { UpdateIdentifierDto } from './dto/update-identifier.dto';
import { IsExistIdentifierDto } from './dto/isExist-identifier.dto';
import { DomainsService } from '../domains/domains.service';
import { DomainStatusEnum } from '../domains/enums/domain-status.enum';
import { ObjectId } from 'mongodb';
import { RequestCheckoutSessionForIdentifierDto } from './dto/request-checkout-session.dto';
import { Event, finalizeEvent, kinds, nip19, Relay, SimplePool } from 'nostr-tools';
import { ApiConfigService } from '../../../src/shared/services/api-config.service';
import axios from 'axios';
import { EventEmitter } from 'node:stream';
import { hexToBytes } from '@noble/hashes/utils';

import { name } from '../../../package.json';
import { IdentifierStatusEnum } from './enums/identifier-status.enum';
import { webcrypto } from 'node:crypto';

const semver = require('semver');

const nodeVersion = process.version;

if (semver.lt(nodeVersion, '20.0.0')) {
  // polyfills for node 18
  global.crypto = require('node:crypto');
  global.WebSocket = require('isomorphic-ws');
} else {
  // polyfills for node 20
  if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as unknown as Crypto;
  }

  global.WebSocket = require('isomorphic-ws');
}

@Injectable()
export class IdentifiersService extends EventEmitter {
  private readonly apiUrl = 'https://api.tryspeed.com/checkout-sessions';

  constructor(
    private readonly repo: identifierRepository,
    private readonly domainService: DomainsService,
    private readonly apiConfig: ApiConfigService,
  ) {
    super();
  }

  async register(arg: CreateIdentifierDto) {
    const { domain } = await this.domainService.findOne({
      where: {
        _id: new ObjectId(arg.domainId),
        status: DomainStatusEnum.ACTIVE,
      },
      select: ['domain'],
    });

    arg.name = arg.name.toLocaleLowerCase()

    const i = this.repo.create({
      fullIdentifier: this.getFullIdentifier(arg.name, domain),
      status: IdentifierStatusEnum.ACTIVE,
      ...arg,
    });
    const res = await this.repo.save(i);

    this.emit('IDENTIFIER_REGISTER', res.toDto());

    return res;
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

    if (arg.domainId || arg.name) {
      const { domain } = await this.domainService.findOne({
        where: {
          _id: new ObjectId(arg.domainId ?? d.domainId),
          status: DomainStatusEnum.ACTIVE,
        },
        select: ['domain'],
      });

      d.assign({ fullIdentifier: this.getFullIdentifier(arg.name ?? d.name, domain) });
    }

    d.assign(arg);

    return this.repo.save(d);
  }

  async isExist(arg: IsExistIdentifierDto) {
    const { domain } = await this.domainService.findOne({
      where: {
        _id: new ObjectId(arg.domainId),
        status: DomainStatusEnum.ACTIVE,
      },
    });

    const identifier = await this.repo.findOne({
      where: {
        name: arg.name,
        domainId: arg.domainId,
      },
    });

    if (identifier) {
      throw new ConflictException('identifier already exist.');
    }

    return {
      fullIdentifier: this.getFullIdentifier(arg.name, domain),
      price: await this.getPrice(arg.name, arg.domainId),
    };
  }

  getFullIdentifier(name: string, domain: string) {
    return `${name.toLocaleLowerCase()}@${domain}`.trim();
  }

  async getPrice(name: string, domainId: string) {
    const { basePrice } = await this.domainService.findOne({
      where: {
        _id: new ObjectId(domainId),
        status: DomainStatusEnum.ACTIVE,
      },
    });

    // if (!username || !domain || !(domain in domainPricing)) {
    //   throw new Error('Invalid NIP-05 format or unknown domain');
    // }

    // Short name bonus: shorter names are more valuable (max bonus for 1-char to 9-char names)
    const shortNameBonus = Math.max(0, (10 - name.length) * 0.1);

    // Repetition penalty: penalize repeated characters like "aaaa" or "oo"
    const repetitions = name.match(/(.)\1{1,}/g) || [];
    const repetitionPenalty = repetitions.length * 0.1;

    const qualityMultiplier = 1 + shortNameBonus - repetitionPenalty;

    return Math.round(basePrice * qualityMultiplier);
  }

  async getCheckoutSession(arg: RequestCheckoutSessionForIdentifierDto) {
    let pubkey: string;
    try {
      const parsed = nip19.decode(arg.npub);
      pubkey = parsed.type === 'npub' ? (parsed.data as string) : (
        parsed.type === 'nprofile' ? (parsed.data as any).pubkey : ''
      );
    } catch (err) {
      throw new BadRequestException('invalid npub');
    }

    const wotConf = this.apiConfig.webOfTrustConfig;
    const createdAt = Math.floor(Date.now() / 1000);

    const event = {
      kind: 5312,
      created_at: createdAt,
      tags: [
        ['param', 'target', pubkey],
        ['param', 'limit', '1'],
      ],
      content: '',
    };

    const signedEvent = finalizeEvent(event, hexToBytes(this.apiConfig.getNostrConfig.privateKey));

    const relay = await Relay.connect(wotConf.relay);
    await relay.publish(signedEvent);

    await new Promise<void>((resolve, reject) => {
      const pool = new SimplePool();
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pool.close([wotConf.relay]);
          resolve();
        }
      }, 4000); // 4 seconds

      pool.subscribeMany(
        [wotConf.relay],
        [
          {
            '#p': [signedEvent.pubkey],
            '#e': ['signedEvent.id'],
          },
        ],
        {
          onevent(event: Event) {
            if (resolved) return;

            try {
              const { rank } = JSON.parse(event.content)[0] as { rank: string };

              pool.close([wotConf.relay]);
              clearTimeout(timeout);
              resolved = true;

              if (parseFloat(rank) < parseFloat(wotConf.relayMinRank)) {
                reject(new BadRequestException('pubkey rank is too low'));
              } else {
                resolve();
              }
            } catch (err) {
              pool.close([wotConf.relay]);
              clearTimeout(timeout);
              resolved = true;
              reject(new Error('Failed to parse rank event'));
            }
          },
        },
      );
    });

    await this.isExist({
      name: arg.name,
      domainId: arg.domainId,
    });

    const price = await this.getPrice(arg.name, arg.domainId);

    const headers = {
      accept: 'application/json',
      'content-type': 'application/json',
      'speed-version': '2022-04-15',
      authorization: `Basic ${Buffer.from(`${this.apiConfig.trySpeedConfig.apiKey}:`).toString('base64')}`,
    };

    const data = {
      currency: 'sats',
      amount: price,
      payment_methods: ['lightning'],
      amount_paid_tolerance: 1,
      metadata: { service: name, pubkey, name: arg.name.toLocaleLowerCase(), domainId: arg.domainId },
      success_url: this.apiConfig.trySpeedConfig.successfulPaymentUrl,
      cancel_url: this.apiConfig.trySpeedConfig.failedPaymentUrl,
    };

    let checkoutSessionUrl: string;

    try {
      checkoutSessionUrl = (await axios.post(this.apiUrl, data, { headers })).data.url;
    } catch (error) {
      console.error('Error generating checkout session:', error);

      throw new Error('Could not generate checkout session');
    }

    return checkoutSessionUrl;
  }
}
