import { Counter } from '@opentelemetry/api-metrics';
import * as VFMetrics from '@voiceflow/metrics';
import Hashids from 'hashids';

import log from '@/logger';
import { Config } from '@/types';

export class Metrics extends VFMetrics.Client.Metrics {
  protected counters: {
    httpRequest: Counter;
    alexa: {
      error: Counter;
      invocation: Counter;
      request: Counter;
    };
  };

  private hashids: Hashids | null;

  constructor(config: Config) {
    super({ ...config, SERVICE_NAME: 'alexa-runtime' });

    super.once('ready', ({ port, path }: VFMetrics.Client.Events['ready']) => {
      log.info(`[metrics] exporter ready ${log.vars({ port, path })}`);
    });

    this.counters = {
      alexa: {
        error: this.meter.createCounter('alexa_request_error', { description: 'Alexa requests errors' }),
        invocation: this.meter.createCounter('alexa_invocation', { description: 'Alexa invocations' }),
        request: this.meter.createCounter('alexa_request', { description: 'Alexa requests' }),
      },
      httpRequest: this.meter.createCounter('http_request', { description: 'HTTP requests' }),
    };

    this.hashids = config.CONFIG_ID_HASH ? new Hashids(config.CONFIG_ID_HASH, 10) : null;
  }

  request(): void {
    this.counters.alexa.request.add(1);
  }

  error(versionID: string): void {
    const decodedVersionID = this.decodeVersionID(versionID);

    this.counters.alexa.error.bind({ skill_id: decodedVersionID }).add(1);
  }

  invocation(versionID: string): string {
    const decodedVersionID = this.decodeVersionID(versionID);

    this.counters.alexa.invocation.bind({ skill_id: decodedVersionID }).add(1);

    return decodedVersionID;
  }

  httpRequest(operation: string, statusCode: number): void {
    this.counters.httpRequest.bind({ operation, status_code: statusCode.toString() }).add(1);
  }

  private decodeVersionID(versionID: string): string {
    if (versionID.length === 24 || !this.hashids) return versionID;

    return this.hashids.decode(versionID)[0].toString();
  }
}

const MetricsClient = (config: Config) => new Metrics(config);

export type MetricsType = Metrics;

export default MetricsClient;
