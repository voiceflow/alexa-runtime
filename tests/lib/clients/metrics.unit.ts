import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';

import config from '@/config';
import MetricsClient, { Metrics } from '@/lib/clients/metrics';

describe('metrics client unit tests', () => {
  beforeEach(() => {
    sinon.restore();
  });

  it('new', () => {
    const NODE_ENV = 'test';
    const loggerStub = sinon.stub().returns({
      increment: () => {
        //
      },
    });

    const metrics = new Metrics({ ...config, NODE_ENV } as any, loggerStub as any);
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

  it('request', () => {
    const metrics = MetricsClient({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });

    metrics.request();
    expect(increment.args).to.eql([['alexa.request']]);
  });

  it('testRequest', () => {
    const metrics = MetricsClient({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });

    metrics.testRequest();
    expect(increment.args).to.eql([['test.request']]);
  });

  it('error', () => {
    const metrics = MetricsClient({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });

    const versionID = 'version_id';
    metrics.error(versionID);
    expect(increment.args).to.eql([['alexa.request.error', 1, [`skill_id:${versionID}`]]]);
  });

  it('invocation', () => {
    const metrics = MetricsClient({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });

    const versionID = 'version_id';
    metrics.invocation(versionID);
    expect(increment.args).to.eql([['alexa.invocation', 1, [`skill_id:${versionID}`]]]);
  });
});
