import './boilerplate.polyfill';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ServicesConfigModule } from './modules/config/config.module';
import { SharedModule } from './shared/shared.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RecordsModule } from './modules/records/records.module';
import { IdentifiersModule } from './modules/identifiers/identifiers.module';
import { UsersModule } from './modules/users/users.module';
import AuthModule from './modules/auth/auth.module';
import { DomainsModule } from './modules/domains/domains.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    SharedModule,
    ServicesConfigModule,
    UsersModule,
    DomainsModule,
    IdentifiersModule,
    RecordsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
