import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ApiConfigService } from '../../shared/services/api-config.service';
import { Nip98Strategy } from './strategies/nip-98.strategy';
import { Nip98AuthGuard } from './guards/nip98-auth.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ApiConfigService],
      useFactory: (configService: ApiConfigService) => ({
        secret: configService.authConfig.secret,
      }),
    }),
  ],
  providers: [ Nip98Strategy, Nip98AuthGuard],
  controllers: [],
  exports: [Nip98AuthGuard,Nip98Strategy],
})
export default class AuthModule {}
