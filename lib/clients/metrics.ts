import secretsProvider from '@voiceflow/secrets-provider';
import { BufferedMetricsLogger } from 'datadog-metrics';

import { Config } from '@/types';

export class Metrics {
  private client: BufferedMetricsLogger;

  constructor(config: Config, Logger: typeof BufferedMetricsLogger) {
    this.client = new Logger({
      apiKey: secretsProvider.get('DATADOG_API_KEY'),
      prefix: `vf_server.${config.NODE_ENV}.`,
      flushIntervalSeconds: 5,
    });
  }

  request() {
    this.client.increment('alexa.request');
  }

  testRequest() {
    this.client.increment('test.request');
  }

  error(versionID: string) {
    this.client.increment('alexa.request.error', 1, [`skill_id:${versionID}`]);
  }

  invocation(versionID: string) {
    this.client.increment('alexa.invocation', 1, [`skill_id:${versionID}`]);
  }
}

const MetricsClient = (config: Config) => new Metrics(config, BufferedMetricsLogger);

export type MetricsType = Metrics;

export default MetricsClient;
