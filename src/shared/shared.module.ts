import type { Provider } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';

import { ApiConfigService } from './services/api-config.service';
import { ServicesConfigModule } from '../../src/modules/config/config.module';
import { IdentifiersModule } from '../../src/modules/identifiers/identifiers.module';
import { SharedController } from './shared.controller';

const providers: Provider[] = [ConfigService, ApiConfigService];

@Global()
@Module({
  providers,
  imports: [
    IdentifiersModule,
    ServicesConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => configService.mongoConfig,
      inject: [ApiConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => configService.redisConfig,
      inject: [ApiConfigService],
    }),
  ],
  controllers: [SharedController],
  exports: [...providers],
})
export class SharedModule {}
