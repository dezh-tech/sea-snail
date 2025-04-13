import type { Provider } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';


import { ApiConfigService } from './services/api-config.service';
import { ServicesConfigModule } from '../../src/modules/config/config.module';

const providers: Provider[] = [ConfigService, ApiConfigService];

@Global()
@Module({
  providers,
  imports: [
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
  controllers: [],
  exports: [...providers],
})
export class SharedModule {}
