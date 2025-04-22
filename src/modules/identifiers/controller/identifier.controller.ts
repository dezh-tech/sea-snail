import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { IdentifiersService } from '../identifiers.service';
import { Nip98AuthGuard } from '../../../../src/modules/auth/guards/nip98-auth.guard';
import { Request } from 'express';
import { IsExistIdentifierDto } from '../dto/isExist-identifier.dto';
import { RequestCheckoutSessionForIdentifierDto } from '../dto/request-checkout-session.dto';

@Controller('identifiers')
@ApiTags('Identifiers')
export class IdentifiersController {
  constructor(private readonly service: IdentifiersService) {}

  @Get('/my')
  @ApiHeader({ name: 'authorization', allowEmptyValue: false, required: true })
  @UseGuards(Nip98AuthGuard)
  async userIdentifierList(@Req() req: Request) {
    const identifiers = await this.service.findAll({
      where: {
        userId: (req.user as { pubkey: string })?.pubkey,
      },
      select: ['name', 'fullIdentifier', 'expireAt', 'status'],
    });

    return identifiers.toDtos();
  }

  @Get('checkout-session')
  async getCheckoutSession(@Query() args: RequestCheckoutSessionForIdentifierDto) {
    return await this.service.getCheckoutSession(args);
  }

  @Get()
  async isIdentifierExist(@Query() args: IsExistIdentifierDto) {
    const identifiers = await this.service.isExist(args);

    return identifiers;
  }
}
