import * as VFMetrics from '@voiceflow/metrics';
import { expect } from 'chai';
import _ from 'lodash';

import MetricsClient from '@/lib/clients/metrics';

const metricsAsserter = new VFMetrics.Testing.MetricsAsserter(MetricsClient);

describe('metrics client unit tests', () => {
  it('new with hash', async () => {
    const config = { CONFIG_ID_HASH: 'hash', ...(await VFMetrics.Testing.createBaseConfig()) };

    const metrics = MetricsClient(config as any);

    expect(_.get(metrics, 'hashids')).to.not.eql(undefined);

    await metrics.stop();
  });

  it('request', async () => {
    const fixture = await metricsAsserter.assertMetric({ expected: /^alexa_request_total 1 \d+$/m });

    fixture.metrics.request();

    await fixture.assert();
  });

  it('error', async () => {
    const versionID = 'a'.repeat(18);

    const fixture = await metricsAsserter.assertMetric({
      expected: /^alexa_request_error_total{skill_id="a{18}"} 1 \d+$/m,
    });

    fixture.metrics.error(versionID);

    await fixture.assert();
  });

  it('invocation', async () => {
    const versionID = 'a'.repeat(18);

    const fixture = await metricsAsserter.assertMetric({
      expected: /^alexa_invocation_total{skill_id="a{18}"} 1 \d+$/m,
    });

    fixture.metrics.invocation(versionID);

    await fixture.assert();
  });

  it('httpRequest', async () => {
    const fixture = await metricsAsserter.assertMetric({
      expected: /^http_request_total{operation="operation",status_code="123"} 1 \d+$/m,
    });

    fixture.metrics.httpRequest('operation', 123);

    await fixture.assert();
  });
});
