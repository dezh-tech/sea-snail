import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordEntity } from './entities/record.entity';
import { RecordRepository } from './record.repository';
import { RecordController } from './record.controller';
import { IdentifiersModule } from '../identifiers/identifiers.module';

@Module({
  imports: [IdentifiersModule, TypeOrmModule.forFeature([RecordEntity])],
  providers: [RecordsService, RecordRepository],
  controllers: [RecordController],
  exports: [RecordsService],
})
export class RecordsModule {}
