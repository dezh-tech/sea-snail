import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RecordsService } from './records.service';
import { Nip98AuthGuard } from '../auth/guards/nip98-auth.guard';
import { Request } from 'express';
import { IdentifiersService } from '../identifiers/identifiers.service';
import { ObjectId } from 'mongodb';
import { UpdateRecordBulkDto } from './dto/update-record.dto';

@Controller('records')
@ApiTags('Records')
export class RecordController {
  constructor(
    private readonly service: RecordsService,
    private readonly identifierService: IdentifiersService,
  ) {}

  @Get(':identifierId')
  @UseGuards(Nip98AuthGuard)
  async recordList(@Req() req: Request, @Param('identifierId') identifierId: string) {
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
  @UseGuards(Nip98AuthGuard)
  async updateRecords(
    @Param('identifierId') identifierId: string,
    @Req() req: Request,
    @Body() args: UpdateRecordBulkDto,
  ) {
    await this.identifierService.findOne({
      where: {
        _id: new ObjectId(identifierId),
        userId: (req.user as { pubkey: string })?.pubkey,
      },
    });

      await this.service.updateClient(identifierId, args);
  }
}
