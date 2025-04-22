import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdentifiersService } from '../../src/modules/identifiers/identifiers.service';

@Controller()
@ApiTags('Shared')
export class SharedController {
  constructor(private readonly identifierService: IdentifiersService) {}

  @Get('.well-known/nostr.json')
  async resolve(@Query('name') _name: string) {

  }
}
