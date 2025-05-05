import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { isNil } from 'lodash';

@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  private getNumber(key: string): number {
    const value = this.get(key);

    try {
      return Number(value);
    } catch {
      throw new Error(key + ' environment variable is not a number');
    }
  }

  private getBoolean(key: string): boolean {
    const value = this.get(key);

    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(key + ' env var is not a boolean');
    }
  }

  private getString(key: string): string {
    const value = this.get(key);

    return value.replaceAll('\\n', '\n');
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV');
  }

  get documentationEnabled(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION');
  }

  get authConfig() {
    return {
      secret: this.getString('JWT_SECRET'),
      jwtExpirationTime: this.getString('JWT_EXPIRATION_TIME'),
    };
  }

  get appConfig() {
    return {
      port: this.getString('PORT'),
    };
  }

  get trySpeedConfig() {
    return {
      webhookSecret: this.getString('TRYSPEED_WEBHOOK_SECRET'),
      apiKey: this.getString('TRYSPEED_API_KEY'),
      successfulPaymentUrl: this.getString('TRYSPEED_SUCCESSFUL_PAYMNET_URL'),
      failedPaymentUrl: this.getString('TRYSPEED_FAILED_PAYMNET_URL'),
    };
  }

  get mongoConfig(): TypeOrmModuleOptions {
    const entities = [__dirname + '/../../{shared,modules}/**/entities/*.entity{.ts,.js}'];

    return {
      dropSchema: this.isTest,
      synchronize: true,
      type: 'mongodb',
      url: this.get('MONGO_DB_URL'),
      logging: this.getBoolean('ENABLE_ORM_LOGS'),
      connectTimeoutMS: this.getNumber('MONGO_DB_CONNECTION_TIMEOUT_IN_MS'),
      entities,
      logger: 'debug',
      database: this.get('MONGO_DB_NAME'),
    };
  }

  get redisConfig(): RedisModuleOptions {
    return {
      type: 'single',
      url: this.getString('REDIS_URI'),
    };
  }

  get grpcConfig() {
    return {
      port: this.getString('GRPC_PORT'),
      protoPath: [
        join(__dirname, '..', '..', 'modules', 'grpc', 'proto', 'domain.proto'),
        join(__dirname, '..', '..', 'modules', 'grpc', 'proto', 'identifier.proto'),
        join(__dirname, '..', '..', 'modules', 'grpc', 'proto', 'health.proto'),
      ],
    };
  }

  get manager() {
    return {
      url: this.getString('MANAGER_URL'),
    };
  }

  get region() {
    return this.getString('DEPLOYMENT_REGION');
  }

  get redisPrefixKey() {
    return this.getString('REDIS_PREFIX_KEY');
  }

  private get(key: string): string {
    const value = this.configService.get<string>(key);

    if (isNil(value)) {
      throw new Error(key + ' environment variable does not set');
    }

    return value;
  }
}
