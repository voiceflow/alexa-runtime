import axios from 'axios';
import { expect } from 'chai';
import getPort from 'get-port';
import _ from 'lodash';
import { setTimeout as sleep } from 'timers/promises';
import types from 'util/types';

import MetricsClient, { Metrics } from '@/lib/clients/metrics';

const baseConfig = async () => ({ PORT_METRICS: await getPort(), NODE_ENV: 'test' });

const assertHelper = async ({ config = {}, expected }: { config?: Record<any, any>; expected: RegExp | ReadonlyArray<RegExp> }) => {
  const combinedConfig = { ...(await baseConfig()), ...config };

  const metrics = MetricsClient(combinedConfig as any);

  const expressions = types.isRegExp(expected) ? [expected] : expected;

  return {
    metrics,
    async assert(): Promise<void> {
      await sleep(1);

      try {
        const { data } = await axios.get<string>(`http://localhost:${combinedConfig.PORT_METRICS}/metrics`);

        expressions.forEach((expression) => {
          expect(data).to.match(expression);
        });
      } finally {
        await metrics.stop();
      }
    },
  };
};

describe('metrics client unit tests', () => {
  it('new', async () => {
    const config = await baseConfig();

    const metrics = new Metrics(config as any);

    await metrics.stop();
  });

  it('new with hash', async () => {
    const config = { CONFIG_ID_HASH: 'hash', ...(await baseConfig()) };

    const metrics = new Metrics(config as any);

    expect(_.get(metrics, 'hashids')).to.not.eql(undefined);

    await metrics.stop();
  });

  it('request', async () => {
    const helper = await assertHelper({ expected: /^alexa_request_total 1 \d+$/m });

    helper.metrics.request();

    await helper.assert();
  });

  it('error', async () => {
    const versionID = 'a'.repeat(18);

    const helper = await assertHelper({ expected: /^alexa_request_error_total{skill_id="a{18}"} 1 \d+$/m });

    helper.metrics.error(versionID);

    await helper.assert();
  });

  it('invocation', async () => {
    const versionID = 'a'.repeat(18);

    const helper = await assertHelper({ expected: /^alexa_invocation_total{skill_id="a{18}"} 1 \d+$/m });

    helper.metrics.invocation(versionID);

    await helper.assert();
  });

  it('httpRequest', async () => {
    const helper = await assertHelper({ expected: /^http_request_total{operation="operation",status_code="123"} 1 \d+$/m });

    helper.metrics.httpRequest('operation', 123);

    await helper.assert();
  });

  it('httpRequestDuration', async () => {
    const helper = await assertHelper({
      expected: [
        /^http_request_duration_count{operation="operation",status_code="123"} 2 \d+$/m,
        /^http_request_duration_sum{operation="operation",status_code="123"} 300 \d+$/m,
        /^http_request_duration_bucket{operation="operation",status_code="123",le="\+Inf"} 2 \d+$/m,
      ],
    });

    helper.metrics.httpRequestDuration('operation', 123, { duration: 200 });
    helper.metrics.httpRequestDuration('operation', 123, { duration: 100 });

    await helper.assert();
  });
});
