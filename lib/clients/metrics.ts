import { Counter, ValueRecorder } from '@opentelemetry/api-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Meter, MeterProvider, MetricExporter } from '@opentelemetry/sdk-metrics-base';
import Hashids from 'hashids';

import log from '@/logger';
import { Config } from '@/types';

export class Metrics {
  private meter: Meter;

  private exporter: MetricExporter;

  private counters: {
    httpRequest: Counter;
    alexa: {
      error: Counter;
      invocation: Counter;
      request: Counter;
    };
  };

  private recorders: {
    httpRequestDuration: ValueRecorder;
  };

  private hashids: Hashids | null;

  constructor(config: Config) {
    const port = config.PORT_METRICS ? Number(config.PORT_METRICS) : PrometheusExporter.DEFAULT_OPTIONS.port;
    const { endpoint } = PrometheusExporter.DEFAULT_OPTIONS;

    this.exporter = new PrometheusExporter({ port, endpoint }, () => {
      log.info(`[metrics] exporter ready ${log.vars({ port, path: endpoint })}`);
    });

    this.meter = new MeterProvider({ exporter: this.exporter, interval: config.NODE_ENV === 'test' ? 0 : 1000 }).getMeter('alexa-runtime');

    this.counters = {
      alexa: {
        error: this.meter.createCounter('alexa_request_error', { description: 'Alexa requests errors' }),
        invocation: this.meter.createCounter('alexa_invocation', { description: 'Alexa invocations' }),
        request: this.meter.createCounter('alexa_request', { description: 'Alexa requests' }),
      },
      httpRequest: this.meter.createCounter('http_request', { description: 'HTTP requests' }),
    };

    this.recorders = {
      httpRequestDuration: this.meter.createValueRecorder('http_request_duration', { description: 'Http requests duration' }),
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

  httpRequestDuration(operation: string, statusCode: number, opts: { duration: number }): void {
    this.recorders.httpRequestDuration
      .bind({
        operation,
        status_code: statusCode.toString(),
      })
      .record(opts.duration);
  }

  private decodeVersionID(versionID: string): string {
    if (versionID.length === 24 || !this.hashids) return versionID;

    return this.hashids.decode(versionID)[0].toString();
  }

  async stop(): Promise<void> {
    await this.meter.shutdown();
    await this.exporter.shutdown();
  }
}

const MetricsClient = (config: Config) => new Metrics(config);

export type MetricsType = Metrics;

export default MetricsClient;
