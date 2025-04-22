import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiTags } from '@nestjs/swagger';
import { RecordsService } from './records.service';
import { Nip98AuthGuard } from '../auth/guards/nip98-auth.guard';
import { Request } from 'express';
import { IdentifiersService } from '../identifiers/identifiers.service';
import { ObjectId } from 'mongodb';
import { UpdateRecordBulkDto, UpdateRecordDto } from './dto/update-record.dto';

@Controller('records')
@ApiTags('Records')
export class RecordController {
  constructor(
    private readonly service: RecordsService,
    private readonly identifierService: IdentifiersService,
  ) {}

  @Get(':identifierId')
  @ApiHeader({ name: 'authorization', allowEmptyValue: false, required: true })
  @UseGuards(Nip98AuthGuard)
  async recordList(@Req() req: Request, @Query('identifierId') identifierId: string) {
    await this.identifierService.findOne({
      where: {
        _id: new ObjectId(identifierId),
        userId: (req.user as { pubkey: string })?.pubkey,
      },
    });

    const r = await this.service.findAll({
      where: {
        identifierId,
      },
    });

    return r.toDtos();
  }

  @Patch(':identifierId')
  @ApiHeader({ name: 'authorization', allowEmptyValue: false, required: true })
  @UseGuards(Nip98AuthGuard)
  async updateRecords(@Req() req: Request, @Param() identifierId: string, @Body() { records }: UpdateRecordBulkDto) {
    await this.identifierService.findOne({
      where: {
        _id: new ObjectId(identifierId),
        userId: (req.user as { pubkey: string })?.pubkey,
      },
    });

    for await (const { id, ...r } of records) {
      await this.service.findOne({
        where: {
          _id: new ObjectId(id),
          identifierId: new ObjectId(identifierId),
        },
      });
      
      await this.service.update(id, r);
    }
  }
}
