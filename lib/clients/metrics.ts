import { Counter } from '@opentelemetry/api-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Meter, MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { BufferedMetricsLogger } from 'datadog-metrics';
import Hashids from 'hashids';

import log from '@/logger';
import { Config } from '@/types';

export class Metrics {
  private client: BufferedMetricsLogger;

  private meter: Meter;

  private counterAlexaError: Counter;

  private counterAlexaInvocation: Counter;

  private counterAlexaRequest: Counter;

  private labels: { [key: string]: string } = {};

  private hashids: Hashids | null;

  constructor(config: Config, Logger: typeof BufferedMetricsLogger) {
    this.client = new Logger({
      apiKey: config.DATADOG_API_KEY,
      prefix: `vf_server.${config.NODE_ENV}.`,
      flushIntervalSeconds: 5,
    });

    const port = config.PORT_METRICS ? parseInt(config.PORT_METRICS, 10) : PrometheusExporter.DEFAULT_OPTIONS.port;

    const exporter = new PrometheusExporter(
      {
        port,
      },
      () => {
        log.info(`[metrics] Available at: port ${port} and path ${PrometheusExporter.DEFAULT_OPTIONS.endpoint}`);
      }
    );

    this.meter = new MeterProvider({ exporter, interval: 1000 }).getMeter('alexa-runtime');

    this.hashids = config.CONFIG_ID_HASH ? new Hashids(config.CONFIG_ID_HASH, 10) : null;

    this.counterAlexaRequest = this.meter.createCounter('alexa.request', {
      description: 'Alexa Requests',
    });

    this.counterAlexaInvocation = this.meter.createCounter('alexa.invocation', {
      description: 'Alexa Invocations',
    });

    this.counterAlexaError = this.meter.createCounter('alexa.request.error', {
      description: 'Alexa requests errors',
    });
  }

  request() {
    this.client.increment('alexa.request');
    this.counterAlexaRequest.bind(this.labels).add(1);
  }

  error(versionID: string) {
    this.client.increment('alexa.request.error', 1, [`skill_id:${this._decodeVersionID(versionID)}`]);
    this.labels.skill_id = `${this._decodeVersionID(versionID)}`;
    this.counterAlexaError.bind(this.labels).add(1);
  }

  invocation(versionID: string) {
    const decodedVersionID = this._decodeVersionID(versionID);
    this.client.increment('alexa.invocation', 1, [`skill_id:${decodedVersionID}`]);
    this.labels.skill_id = `${this._decodeVersionID(versionID)}`;
    this.counterAlexaInvocation.bind(this.labels).add(1);
    return decodedVersionID;
  }

  _decodeVersionID(versionID: string) {
    if (versionID.length === 24 || !this.hashids) return versionID;

    return this.hashids.decode(versionID)[0];
  }
}

const MetricsClient = (config: Config) => new Metrics(config, BufferedMetricsLogger);

export type MetricsType = Metrics;

export default MetricsClient;
