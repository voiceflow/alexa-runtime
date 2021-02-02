import { BufferedMetricsLogger } from 'datadog-metrics';
import Hashids from 'hashids';

import { Config } from '@/types';

export class Metrics {
  private client: BufferedMetricsLogger;

  private hashids: Hashids | null;

  constructor(config: Config, Logger: typeof BufferedMetricsLogger) {
    this.client = new Logger({
      apiKey: config.DATADOG_API_KEY,
      prefix: `vf_server.${config.NODE_ENV}.`,
      flushIntervalSeconds: 5,
    });

    this.hashids = config.CONFIG_ID_HASH ? new Hashids(config.CONFIG_ID_HASH, 10) : null;
  }

  request() {
    this.client.increment('alexa.request');
  }

  error(versionID: string) {
    this.client.increment('alexa.request.error', 1, [`skill_id:${this._decodeVersionID(versionID)}`]);
  }

  invocation(versionID: string) {
    const decodedVersionID = this._decodeVersionID(versionID);
    this.client.increment('alexa.invocation', 1, [`skill_id:${decodedVersionID}`]);
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
