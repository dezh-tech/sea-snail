import { Module } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { DomainsController } from './domains.controller';
import { DomainRepository } from './domain.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainEntity } from './entities/domain.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DomainEntity])],
  controllers: [DomainsController],
  providers: [DomainsService, DomainRepository],
  exports: [DomainsService],
})
export class DomainsModule {}
