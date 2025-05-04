import { Injectable, OnModuleInit } from '@nestjs/common';
import { ApiConfigService } from './api-config.service';
import { ManagerGrpcClient } from '../../../src/modules/grpc/manager.client';
import { lastValueFrom } from 'rxjs';
import { ServiceTypeEnum } from '../../../src/modules/grpc/gen/ts/service_registry';

@Injectable()
export class BootstrapService implements OnModuleInit {
  constructor(
    private readonly apiConfig: ApiConfigService,
    private readonly managerGrpcClient: ManagerGrpcClient,
  ) {}

  async onModuleInit() {
    this.managerGrpcClient.setUrl(this.apiConfig.manager.url);

    await lastValueFrom(
      this.managerGrpcClient.serviceClient.registerService({
        type: ServiceTypeEnum.NIP05,
        heartbeatDurationInSec: 10,
        port: this.apiConfig.grpcConfig.port,
        region: this.apiConfig.region,
      }),
    );
  }
}
