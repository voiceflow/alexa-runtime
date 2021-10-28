import { Counter, ValueRecorder } from '@opentelemetry/api-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Meter, MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { BufferedMetricsLogger } from 'datadog-metrics';
import Hashids from 'hashids';

import log from '@/logger';
import { Config } from '@/types';

export class Metrics {
  private client: BufferedMetricsLogger;

  private mAlexaRuntime: Meter;

  private cAlexaError: Counter;

  private cAlexaInvocation: Counter;

  private cAlexaRequest: Counter;

  private cHttpRequest: Counter;

  private rHttpRequestDuration: ValueRecorder;

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

    this.mAlexaRuntime = new MeterProvider({ exporter, interval: 1000 }).getMeter('alexa-runtime');

    this.cHttpRequest = this.mAlexaRuntime.createCounter('http_request', {
      description: 'Http requests',
    });

    this.rHttpRequestDuration = this.mAlexaRuntime.createValueRecorder('http_request_duration', {
      description: 'Http requests duration',
    });

    this.hashids = config.CONFIG_ID_HASH ? new Hashids(config.CONFIG_ID_HASH, 10) : null;

    this.cAlexaRequest = this.mAlexaRuntime.createCounter('alexa_request', {
      description: 'Alexa Requests',
    });

    this.cAlexaInvocation = this.mAlexaRuntime.createCounter('alexa_invocation', {
      description: 'Alexa Invocations',
    });

    this.cAlexaError = this.mAlexaRuntime.createCounter('alexa_request_error', {
      description: 'Alexa requests errors',
    });
  }

  request() {
    this.client.increment('alexa.request');
    this.cAlexaRequest.bind(this.labels).add(1);
  }

  error(versionID: string) {
    this.client.increment('alexa.request.error', 1, [`skill_id:${this._decodeVersionID(versionID)}`]);
    this.labels.skill_id = `${this._decodeVersionID(versionID)}`;
    this.cAlexaError.bind(this.labels).add(1);
  }

  invocation(versionID: string) {
    const decodedVersionID = this._decodeVersionID(versionID);
    this.client.increment('alexa.invocation', 1, [`skill_id:${decodedVersionID}`]);
    this.labels.skill_id = `${this._decodeVersionID(versionID)}`;
    this.cAlexaInvocation.bind(this.labels).add(1);
    return decodedVersionID;
  }

  httpRequest(operation: string, statusCode: number) {
    this.labels.operation = operation;
    this.labels.status_code = statusCode.toString();
    this.cHttpRequest.bind(this.labels).add(1);
  }

  httpRequestDuration(operation: string, statusCode: number, duration: number) {
    this.labels.operation = operation;
    this.labels.status_code = statusCode.toString();
    this.rHttpRequestDuration.bind(this.labels).record(duration);
  }

  _decodeVersionID(versionID: string) {
    if (versionID.length === 24 || !this.hashids) return versionID;

    return this.hashids.decode(versionID)[0];
  }
}

const MetricsClient = (config: Config) => new Metrics(config, BufferedMetricsLogger);

export type MetricsType = Metrics;

export default MetricsClient;
