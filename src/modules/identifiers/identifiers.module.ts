import { Module } from '@nestjs/common';
import { IdentifiersService } from './identifiers.service';
import { identifierRepository } from './identifiers.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { identifiersEntity } from './entities/identifier.entity';
import { IdentifierServiceGrpcController } from './controller/identifier-grpc.controller';
import { IdentifiersController } from './controller/identifier.controller';
import { DomainsModule } from '../domains/domains.module';

@Module({
  imports: [DomainsModule, TypeOrmModule.forFeature([identifiersEntity])],
  providers: [IdentifiersService, identifierRepository],
  controllers: [IdentifierServiceGrpcController, IdentifiersController],
  exports: [IdentifiersService]
})
export class IdentifiersModule {}
