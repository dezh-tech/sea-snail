import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordEntity } from './entities/record.entity';
import { RecordRepository } from './record.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RecordEntity])],
  providers: [RecordsService, RecordRepository],
})
export class RecordsModule {}
