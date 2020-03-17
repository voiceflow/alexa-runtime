import { EventType } from '@voiceflow/client';
import { expect } from 'chai';
import sinon from 'sinon';

import { T, TEST_VERSION_ID } from '@/lib/constants';
import TestManager from '@/lib/services/test';

describe('test manager unit tests', () => {
  describe('invoke', () => {
    it('works correctly', async () => {
      const rawState = { foo: 'bar' };
      const trace = { foo1: 'bar1' };

      const context = {
        setEvent: sinon.stub(),
        turn: {
          set: sinon.stub(),
        },
        update: sinon.stub(),
        getRawState: sinon.stub().returns(rawState),
        getTrace: sinon.stub().returns(trace),
      };

      const services = {
        voiceflow: { createContext: sinon.stub().returns(context) },
        utils: { addBlockTrace: sinon.stub() },
      };

      const config = {
        VF_DATA_ENDPOINT: 'random-endpoint',
      };

      const testManager = new TestManager(services as any, config as any);

      const state = { foo2: 'bar2' };
      const request = { foo3: 'bar3' };
      expect(await testManager.invoke(state as any, request as any)).to.eql({ ...rawState, trace });
      expect(services.voiceflow.createContext.args).to.eql([
        [
          TEST_VERSION_ID,
          state,
          request,
          {
            endpoint: `${config.VF_DATA_ENDPOINT}/test`,
          },
        ],
      ]);
      expect(context.setEvent.args[0][0]).to.eql(EventType.handlerWillHandle);
      const fn = context.setEvent.args[0][1];
      const event = { context: { foo4: 'bar3' }, block: { blockID: 'block-id' } };
      fn(event);
      expect(services.utils.addBlockTrace.args).to.eql([[event.context, event.block.blockID]]);
      expect(context.turn.set.args).to.eql([[T.REQUEST, request]]);
      expect(context.update.callCount).to.eql(1);
    });
  });
});
