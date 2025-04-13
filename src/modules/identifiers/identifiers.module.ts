import { Module } from '@nestjs/common';
import { IdentifiersService } from './identifiers.service';
import { identifierRepository } from './identifiers.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { identifiersEntity } from './entities/identifier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([identifiersEntity])],
  providers: [IdentifiersService, identifierRepository],
})
export class IdentifiersModule {}
