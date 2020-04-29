import secretsProvider from '@voiceflow/secrets-provider';
import { BufferedMetricsLogger } from 'datadog-metrics';
import Hashids from 'hashids';

import { Config } from '@/types';

class Metrics {
  private client: BufferedMetricsLogger;

  private hashids: Hashids;

  constructor(config: Config) {
    this.client = new BufferedMetricsLogger({
      apiKey: secretsProvider.get('DATADOG_API_KEY'),
      prefix: `vf-server.${config.NODE_ENV}`,
      flushIntervalSeconds: 5,
    });
    this.hashids = new Hashids(secretsProvider.get('CONFIG_ID_HASH'), 10);
  }

  request() {
    this.client.increment('alexa.request');
  }

  testRequest() {
    this.client.increment('test.request');
  }

  error(versionID: string) {
    const [decodedVersionID] = this.hashids.decode(versionID);
    this.client.increment('alexa.request.error', 1, [`skill_id:${decodedVersionID}`]);
  }

  invocation(versionID: string) {
    const [decodedVersionID] = this.hashids.decode(versionID);
    this.client.increment('alexa.invocation', 1, [`skill_id:${decodedVersionID}`]);
  }
}

export type MetricsType = BufferedMetricsLogger;

export default Metrics;
