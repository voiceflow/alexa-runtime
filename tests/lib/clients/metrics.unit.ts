import secretsProvider from '@voiceflow/secrets-provider';
import { expect } from 'chai';
import * as Datadog from 'datadog-metrics';
import * as Hashids from 'hashids';
import _ from 'lodash';
import sinon from 'sinon';

import Metrics from '@/lib/clients/metrics';

describe('metrics client unit tests', () => {
  before(async () => {
    await secretsProvider.start({
      SECRETS_PROVIDER: 'test',
    });
  });

  beforeEach(() => {
    sinon.restore();
  });

  describe('new', () => {
    it('works correctly', () => {
      const NODE_ENV = 'test';
      const hashidsStub = sinon.stub(Hashids, 'default');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const metrics = new Metrics({ NODE_ENV } as any);

      expect(hashidsStub.calledWithNew()).to.eql(true);
      expect(hashidsStub.args).to.eql([[secretsProvider.get('CONFIG_ID_HASH'), 10]]);
    });
  });

  it('request', () => {
    const metrics = new Metrics({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });

    metrics.request();
    expect(increment.args).to.eql([['alexa.request']]);
  });

  it('testRequest', () => {
    const metrics = new Metrics({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });

    metrics.testRequest();
    expect(increment.args).to.eql([['test.request']]);
  });

  it('error', () => {
    const metrics = new Metrics({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });

    const versionID = 1;
    const encodedVersionID = _.get(metrics, 'hashids').encode(versionID);
    metrics.error(encodedVersionID);
    expect(increment.args).to.eql([['alexa.request.error', 1, [`skill_id:${versionID}`]]]);
  });

  it('invocation', () => {
    const metrics = new Metrics({} as any);
    const increment = sinon.stub();
    _.set(metrics, 'client', { increment });

    const versionID = 1;
    const encodedVersionID = _.get(metrics, 'hashids').encode(versionID);
    metrics.invocation(encodedVersionID);
    expect(increment.args).to.eql([['alexa.invocation', 1, [`skill_id:${versionID}`]]]);
  });
});
