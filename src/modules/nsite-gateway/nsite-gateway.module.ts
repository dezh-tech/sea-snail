import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { NsiteGatewayService } from './nsite-gateway.service';
import { SharedModule } from '../../shared/shared.module';
import { NsiteGatewayMiddleware } from './nsite-gateway.middleware';
import { DomainsModule } from '../domains/domains.module';
import { IdentifiersModule } from '../identifiers/identifiers.module';
import { RecordsModule } from '../records/records.module';

@Module({
  imports: [SharedModule, DomainsModule, IdentifiersModule, RecordsModule],
  providers: [NsiteGatewayService, NsiteGatewayMiddleware],
  exports: [NsiteGatewayService, NsiteGatewayMiddleware],
})
export class NsiteGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(NsiteGatewayMiddleware).forRoutes('*');
  }
}

