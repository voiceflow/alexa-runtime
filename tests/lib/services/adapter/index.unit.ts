import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';

import AdapterManager from '@/lib/services/adapter';

import { newInteraction, newMalformed, oldInteraction, oldMalformed } from './fixtures';

describe('adapterManager unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('context', () => {
    it('empty', async () => {
      const adapter = new AdapterManager(null as any, null as any);
      const input = { attributesManager: { getPersistentAttributes: sinon.stub().resolves({}) } };

      await adapter.context(input as any);
      expect(input.attributesManager.getPersistentAttributes.callCount).to.eql(1);
    });

    it('new format', async () => {
      const adapter = new AdapterManager(null as any, null as any);
      const input = { attributesManager: { getPersistentAttributes: sinon.stub().resolves({ stack: [] }) } };

      await adapter.context(input as any);
      expect(input.attributesManager.getPersistentAttributes.callCount).to.eql(1);
    });

    it('old format', async () => {
      const oldContext = { diagrams: [] };
      const newContext = { stack: [] };
      const transformContextStub = sinon.stub().resolves(newContext);

      const adapter = new AdapterManager(null as any, null as any);
      adapter.transformContext = transformContextStub;

      const input = { attributesManager: { getPersistentAttributes: sinon.stub().resolves(oldContext), setPersistentAttributes: sinon.stub() } };

      await adapter.context(input as any);
      expect(input.attributesManager.getPersistentAttributes.callCount).to.eql(1);
      expect(transformContextStub.args).to.eql([[oldContext, input]]);
      expect(input.attributesManager.setPersistentAttributes.args).to.eql([[newContext]]);
    });
  });

  describe('transformContext', () => {
    const tests = [
      { text: 'malformed', old: oldMalformed, new: newMalformed },
      { text: 'wait on interaction', old: oldInteraction, new: newInteraction },
    ];

    tests.forEach((test) => {
      it(test.text, async () => {
        const adapter = new AdapterManager(null as any, null as any);

        const System = _.get(test.new, 'variables._system');
        const input = { requestEnvelope: { context: { System } } };

        expect(await adapter.transformContext(test.old as any, input as any)).to.deep.equalInAnyOrder(test.new);
      });
    });
  });
});
