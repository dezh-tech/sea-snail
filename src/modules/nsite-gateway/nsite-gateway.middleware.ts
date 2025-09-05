import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { NsiteGatewayService } from './nsite-gateway.service';

@Injectable()
export class NsiteGatewayMiddleware implements NestMiddleware {
  constructor(private readonly service: NsiteGatewayService) {}

  use(req: Request, res: Response, next: Function) {
    this.service.handle(req, res, next);
  }
}

