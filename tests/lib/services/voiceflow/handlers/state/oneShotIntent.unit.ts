import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import { OneShotIntentHandler } from '@/lib/services/runtime/handlers/state/oneShotIntent';
import { RequestType } from '@/lib/services/runtime/types';

describe('one shot intent handler unit tests', () => {
  const oneShotIntentHandler = OneShotIntentHandler(null as any);

  describe('canHandle', () => {
    it('false', () => {
      const runtime = {
        turn: { get: sinon.stub().returns(false) },
        getRequest: sinon.stub().returns({ type: RequestType.INTENT }),
      };
      const result = oneShotIntentHandler.canHandle(null as any, runtime as any, null as any, null as any);
      expect(result).to.eql(false);
      expect(runtime.turn.get.args).to.eql([[T.NEW_STACK]]);
      expect(runtime.getRequest.callCount).to.eql(0);
    });

    it('false with no intent', () => {
      const runtime = { turn: { get: sinon.stub().returns(true) }, getRequest: sinon.stub().returns({ type: false }) };
      const result = oneShotIntentHandler.canHandle(null as any, runtime as any, null as any, null as any);
      expect(result).to.eql(false);
      expect(runtime.turn.get.args).to.eql([[T.NEW_STACK]]);
      expect(runtime.getRequest.callCount).to.eql(1);
    });

    it('false with command handler', () => {
      const runtime = {
        turn: { get: sinon.stub().returns(true) },
        getRequest: sinon.stub().returns({ type: RequestType.INTENT }),
      };
      const utils = {
        commandHandler: {
          canHandle: sinon.stub().returns(false),
        },
      };
      const result = OneShotIntentHandler(utils as any).canHandle(
        null as any,
        runtime as any,
        null as any,
        null as any
      );
      expect(result).to.eql(false);
      expect(runtime.turn.get.args).to.eql([[T.NEW_STACK]]);
      expect(runtime.getRequest.callCount).to.eql(1);
      expect(utils.commandHandler.canHandle.callCount).to.eql(1);
    });

    it('true', () => {
      const runtime = {
        turn: { get: sinon.stub().returns(true) },
        getRequest: sinon.stub().returns({ type: RequestType.INTENT }),
      };
      const utils = {
        commandHandler: {
          canHandle: sinon.stub().returns(true),
        },
      };
      const result = OneShotIntentHandler(utils as any).canHandle(
        null as any,
        runtime as any,
        null as any,
        null as any
      );
      expect(result).to.eql(true);
      expect(runtime.turn.get.args).to.eql([[T.NEW_STACK]]);
      expect(runtime.getRequest.callCount).to.eql(1);
      expect(utils.commandHandler.canHandle.callCount).to.eql(1);
    });
  });

  describe('handle', () => {
    const utils = {
      commandHandler: {
        handle: sinon.stub().returns('bar'),
      },
    };
    const result = OneShotIntentHandler(utils as any).handle(null as any, 'foo' as any, null as any, null as any);
    expect(result).to.eql('bar');
    expect(utils.commandHandler.handle.args[0][0]).to.eql('foo');
  });
});
