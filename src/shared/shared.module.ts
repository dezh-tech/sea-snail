import type { Provider } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';

import { ApiConfigService } from './services/api-config.service';
import { ServicesConfigModule } from '../../src/modules/config/config.module';
import { IdentifiersModule } from '../../src/modules/identifiers/identifiers.module';
import { SharedController } from './shared.controller';
import { RecordsModule } from '../../src/modules/records/records.module';
import { ManagerGrpcClient } from '../../src/modules/grpc/manager.client';
import { HealthServiceGrpcController } from './shared-grpc.controller';
import { BootstrapService } from './services/bootstrap.service';
import { DomainsModule } from '../../src/modules/domains/domains.module';

const providers: Provider[] = [ConfigService, ApiConfigService, ManagerGrpcClient,BootstrapService];

@Global()
@Module({
  providers,
  imports: [
    IdentifiersModule,
    RecordsModule,
    ServicesConfigModule,
    DomainsModule,
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
  controllers: [HealthServiceGrpcController, SharedController],
  exports: [...providers],
})
export class SharedModule {}
