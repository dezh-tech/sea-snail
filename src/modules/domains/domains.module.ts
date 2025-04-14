import { Module } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { DomainRepository } from './domain.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainEntity } from './entities/domain.entity';
import { DomainServiceGrpcController } from './controllers/domain-grpc.controller';
import { DomainsController } from './controllers/domain.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DomainEntity])],
  controllers: [DomainServiceGrpcController, DomainsController],
  providers: [DomainsService, DomainRepository],
  exports: [DomainsService],
})
export class DomainsModule {}
