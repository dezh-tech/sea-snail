import { PickType } from '@nestjs/swagger';
import { RecordDto } from './record.dto';

export class CreateRecordDto extends PickType(RecordDto, ['type', 'key','value', 'priority', 'ttl', 'identifierId'] as const) {}
