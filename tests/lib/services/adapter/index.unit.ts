import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';

import AdapterManager from '@/lib/services/adapter';

import {
  newBasic,
  newCommandCalled,
  newDisplay,
  newInteraction,
  newMalformed,
  newMissing,
  newOutputMap,
  newStreamOne,
  newStreamTwo,
  newStreamTwoNoLine,
  oldBasic,
  oldCommandCalled,
  oldDisplay,
  oldInteraction,
  oldMalformed,
  oldMissing,
  oldOutputMap,
  oldStreamOne,
  oldStreamTwo,
  oldStreamTwoNoLine,
} from './fixtures';

describe('adapterManager unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('runtime', () => {
    it('empty', async () => {
      const adapter = new AdapterManager(null as any, null as any);
      const input = { attributesManager: { getPersistentAttributes: sinon.stub().resolves({}) } };

      await adapter.state(input as any);
      expect(input.attributesManager.getPersistentAttributes.callCount).to.eql(1);
    });

    it('new format', async () => {
      const adapter = new AdapterManager(null as any, null as any);
      const input = { attributesManager: { getPersistentAttributes: sinon.stub().resolves({ stack: [] }) } };

      await adapter.state(input as any);
      expect(input.attributesManager.getPersistentAttributes.callCount).to.eql(1);
    });

    it('old format', async () => {
      const oldState = { diagrams: [] };
      const newContext = { stack: [] };
      const transformContextStub = sinon.stub().resolves(newContext);

      const adapter = new AdapterManager(null as any, null as any);
      adapter.transformState = transformContextStub;

      const input = { attributesManager: { getPersistentAttributes: sinon.stub().resolves(oldState), setPersistentAttributes: sinon.stub() } };

      await adapter.state(input as any);
      expect(input.attributesManager.getPersistentAttributes.callCount).to.eql(1);
      expect(transformContextStub.args).to.eql([[oldState, input]]);
      expect(input.attributesManager.setPersistentAttributes.args).to.eql([[newContext]]);
    });
  });

  describe('transformContext', () => {
    const tests = [
      { text: 'malformed', old: oldMalformed, new: newMalformed },
      { text: 'hello world', old: oldBasic, new: newBasic },
      { text: 'hello world wrapped', old: { attributes: oldBasic }, new: newBasic },
      { text: 'wait on interaction', old: oldInteraction, new: newInteraction },
      { text: 'missing attributes', old: oldMissing, new: newMissing },
      { text: 'outputmap', old: oldOutputMap, new: newOutputMap },
      { text: 'command called', old: oldCommandCalled, new: newCommandCalled },
      { text: 'stream one node', old: oldStreamOne, new: newStreamOne },
      { text: 'stream two nodes', old: oldStreamTwo, new: newStreamTwo },
      { text: 'stream two nodes no next_line', old: oldStreamTwoNoLine, new: newStreamTwoNoLine },
      { text: 'display', old: oldDisplay, new: newDisplay },
    ];

    tests.forEach((test) => {
      it(test.text, async () => {
        const adapter = new AdapterManager(null as any, null as any);

        const System = _.get(test.new, 'variables._system');
        const input = { requestEnvelope: { context: { System } } };

        expect(await adapter.transformState(test.old as any, input as any)).to.deep.equalInAnyOrder(test.new);
      });
    });
  });
});
