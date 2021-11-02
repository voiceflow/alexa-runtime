import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';

import config from '@/config';
import MetricsClient, { Metrics } from '@/lib/clients/metrics';

describe('metrics client unit tests', () => {
  let metrics: Metrics;

  beforeEach(() => {
    sinon.restore();
  });

  afterEach(async () => {
    await metrics.stop();
  });

  it('new', async () => {
    const NODE_ENV = 'test';
    const loggerStub = sinon.stub().returns({
      increment: () => {
        //
      },
    });

    metrics = new Metrics({ ...config, NODE_ENV } as any, loggerStub as any);
    expect(typeof _.get(metrics, 'client.increment')).to.eql('function');

    expect(loggerStub.calledWithNew()).to.eql(true);
    expect(loggerStub.args).to.eql([
      [
        {
          apiKey: config.DATADOG_API_KEY,
          prefix: `vf_server.${NODE_ENV}.`,
          flushIntervalSeconds: 5,
        },
      ],
    ]);
  });

  it('new with hash', async () => {
    const NODE_ENV = 'test';
    const loggerStub = sinon.stub().returns({
      increment: () => {
        //
      },
    });

    metrics = new Metrics({ ...config, NODE_ENV, CONFIG_ID_HASH: 'hash' } as any, loggerStub as any);
    expect(_.get(metrics, 'hashids') !== undefined).to.eql(true);
  });

  it('request', async () => {
    metrics = MetricsClient({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });

    metrics.request();
    expect(increment.args).to.eql([['alexa.request']]);
  });

  it('error', async () => {
    metrics = MetricsClient({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });
    sinon.stub(metrics, '_decodeVersionID').returnsArg(0);

    const versionID = 'version_id';
    metrics.error(versionID);
    expect(increment.args).to.eql([['alexa.request.error', 1, [`skill_id:${versionID}`]]]);
  });

  it('invocation', async () => {
    metrics = MetricsClient({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });
    sinon.stub(metrics, '_decodeVersionID').returnsArg(0);

    const versionID = 'version_id';
    metrics.invocation(versionID);
    expect(increment.args).to.eql([['alexa.invocation', 1, [`skill_id:${versionID}`]]]);
  });

  describe('_decodeVersionID', () => {
    it('no hashids', async () => {
      metrics = MetricsClient({} as any);
      const versionID = 'version-id';
      expect(metrics._decodeVersionID(versionID)).to.eql(versionID);
    });

    it('object id', async () => {
      metrics = MetricsClient({ CONFIG_ID_HASH: 'hash-key' } as any);
      const versionID = '5f74a6f5e4a40c344b1ef366';
      expect(metrics._decodeVersionID(versionID)).to.eql(versionID);
    });

    it('with hashids', async () => {
      metrics = MetricsClient({ CONFIG_ID_HASH: 'hash-key' } as any);
      const versionID = 5;
      expect(metrics._decodeVersionID(_.get(metrics, 'hashids').encode(versionID))).to.eql(versionID);
    });
  });
});
