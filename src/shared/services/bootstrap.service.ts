import { Injectable, OnModuleInit } from '@nestjs/common';
import { ApiConfigService } from './api-config.service';
import { ManagerGrpcClient } from '../../../src/modules/grpc/manager.client';
import { lastValueFrom } from 'rxjs';
import { ServiceTypeEnum } from '../../../src/modules/grpc/gen/ts/service_registry';

import * as os from 'os';

@Injectable()
export class BootstrapService implements OnModuleInit {
  constructor(
    private readonly apiConfig: ApiConfigService,
    private readonly managerGrpcClient: ManagerGrpcClient,
  ) {}

  async onModuleInit() {
    const overlayIp = this.getOverlayIpAddress();

    if (!overlayIp) {
      throw Error('unable to get overlayIp');
    }

    this.managerGrpcClient.setUrl(this.apiConfig.manager.url);

    await lastValueFrom(
      this.managerGrpcClient.serviceClient.registerService({
        type: ServiceTypeEnum.NIP05,
        heartbeatDurationInSec: 10,
        url: overlayIp,
        port: this.apiConfig.grpcConfig.port,
        region: this.apiConfig.region,
      }),
    );
  }

  getOverlayIpAddress(): string | null {
    const networkInterfaces = os.networkInterfaces();

    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];

      if (networkInterface) {
        for (const interfaceInfo of networkInterface) {
          // Look for IPv4 addresses that are not internal (loopback)
          if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
            // This is likely the IP within the Docker overlay network
            return interfaceInfo.address;
          }
        }
      }
    }

    return null; // Could not find a suitable IP address
  }
}
