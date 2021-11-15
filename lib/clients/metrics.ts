import { Counter, ValueRecorder } from '@opentelemetry/api-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Meter, MeterProvider, MetricExporter } from '@opentelemetry/sdk-metrics-base';
import { BufferedMetricsLogger } from 'datadog-metrics';
import Hashids from 'hashids';

import log from '@/logger';
import { Config } from '@/types';

export class Metrics {
  // TODO: remove this old client
  /** @deprecated */
  private client: BufferedMetricsLogger;

  private meter: Meter;

  private exporter: MetricExporter;

  private counters: Record<'alexaError' | 'alexaInvocation' | 'alexaRequest' | 'httpRequest', Counter>;

  private recorders: Record<'httpRequestDuration', ValueRecorder>;

  private labels: Partial<Record<'skill_id' | 'operation' | 'status_code', string>> = {};

  private hashids: Hashids | null;

  constructor(config: Config, Logger: typeof BufferedMetricsLogger) {
    this.client = new Logger({
      apiKey: config.DATADOG_API_KEY,
      prefix: `vf_server.${config.NODE_ENV}.`,
      flushIntervalSeconds: 5,
    });

    const port = config.PORT_METRICS ? parseInt(config.PORT_METRICS, 10) : PrometheusExporter.DEFAULT_OPTIONS.port;

    this.exporter = new PrometheusExporter({ port }, () => {
      log.info(`[metrics] exporter ready ${log.vars({ port, path: PrometheusExporter.DEFAULT_OPTIONS.endpoint })}`);
    });

    this.meter = new MeterProvider({ exporter: this.exporter, interval: 1000 }).getMeter('alexa-runtime');

    this.counters = {
      alexaError: this.meter.createCounter('alexa_request_error', { description: 'Alexa requests errors' }),
      alexaInvocation: this.meter.createCounter('alexa_invocation', { description: 'Alexa invocations' }),
      alexaRequest: this.meter.createCounter('alexa_request', { description: 'Alexa requests' }),
      httpRequest: this.meter.createCounter('http_request', { description: 'HTTP requests' }),
    };

    this.recorders = {
      httpRequestDuration: this.meter.createValueRecorder('http_request_duration', { description: 'Http requests duration' }),
    };

    this.hashids = config.CONFIG_ID_HASH ? new Hashids(config.CONFIG_ID_HASH, 10) : null;
  }

  request() {
    this.client.increment('alexa.request');

    this.counters.alexaRequest.bind(this.labels).add(1);
  }

  error(versionID: string) {
    this.client.increment('alexa.request.error', 1, [`skill_id:${this._decodeVersionID(versionID)}`]);

    this.labels.skill_id = this._decodeVersionID(versionID).toString();

    this.counters.alexaError.bind(this.labels).add(1);
  }

  invocation(versionID: string) {
    this.labels.skill_id = this._decodeVersionID(versionID).toString();

    this.counters.alexaInvocation.bind(this.labels).add(1);

    const decodedVersionID = this._decodeVersionID(versionID);
    this.client.increment('alexa.invocation', 1, [`skill_id:${decodedVersionID}`]);

    return decodedVersionID;
  }

  httpRequest(operation: string, statusCode: number) {
    this.labels.operation = operation;
    this.labels.status_code = statusCode.toString();

    this.counters.httpRequest.bind(this.labels).add(1);
  }

  httpRequestDuration(operation: string, statusCode: number, duration: number) {
    this.labels.operation = operation;
    this.labels.status_code = statusCode.toString();

    this.recorders.httpRequestDuration.bind(this.labels).record(duration);
  }

  _decodeVersionID(versionID: string) {
    if (versionID.length === 24 || !this.hashids) return versionID;

    return this.hashids.decode(versionID)[0];
  }

  async stop() {
    await this.meter.shutdown();
    await this.exporter.shutdown();
  }
}

const MetricsClient = (config: Config) => new Metrics(config, BufferedMetricsLogger);

export type MetricsType = Metrics;

export default MetricsClient;
