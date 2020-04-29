import secretsProvider from '@voiceflow/secrets-provider';
import { BufferedMetricsLogger } from 'datadog-metrics';

import { Config } from '@/types';

const Metrics = (config: Config) => {
  return new BufferedMetricsLogger({
    apiKey: secretsProvider.get('DATADOG_API_KEY'),
    prefix: `vf-server.${config.NODE_ENV}`,
    flushIntervalSeconds: 5,
  });
};

export type MetricsType = BufferedMetricsLogger;

export default Metrics;
