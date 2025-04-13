import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Nip11Repository } from './repositories/nip11.repository';
import { ConfigService } from './config.service';
import { Nip11Entity } from './entities/nip11.entity';
import { APP_FILTER } from '@nestjs/core';
import { GrpcServerExceptionFilter } from "nestjs-grpc-exceptions";


@Module({
  imports: [TypeOrmModule.forFeature([Nip11Entity])],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GrpcServerExceptionFilter,
    },
    ConfigService,
    Nip11Repository,
  ],
  controllers: [],
  exports: [ConfigService],
})
export class ServicesConfigModule {}
