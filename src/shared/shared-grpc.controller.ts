import { Controller } from '@nestjs/common';
import type { Metadata } from '@grpc/grpc-js';
import {
  HealthServiceController,
  HealthServiceControllerMethods,
  StatusRequest,
  StatusResponse,
  Status,
  Service,
} from '../../src/modules/grpc/gen/ts/relay-health';
import { version, name } from '../../package.json';

const appStartTime = Date.now();

@Controller()
@HealthServiceControllerMethods()
export class HealthServiceGrpcController implements HealthServiceController {
  constructor() {}

  async status(_request: StatusRequest, _metadata?: Metadata): Promise<StatusResponse> {

    const uptimeSeconds = Math.floor((Date.now() - appStartTime) / 1000);

    const serviceStatus: Service = {
      name,
      status: Status[Status.CONNECTED as unknown as keyof typeof Status],
      message: '',
    };

    return {
      services: [serviceStatus],
      uptime: uptimeSeconds,
      version,
    };
  }
}
