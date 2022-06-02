import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import CancelPurchaseHandler, {
  CancelPurchaseHandlerGenerator,
  Request,
} from '@/lib/services/alexa/request/cancelPurchase';

describe('cancel purchase handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(
        CancelPurchaseHandler.canHandle({
          requestEnvelope: { request: { type: 'random-type', name: 'random-name' } },
        } as any)
      ).to.eql(false);
    });

    it('true', () => {
      expect(
        CancelPurchaseHandler.canHandle({
          requestEnvelope: { request: { type: Request.RESPONSE_TYPE, name: Request.REQ_NAME } },
        } as any)
      ).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', async () => {
      const output = 'output';

      const utils = {
        IntentHandler: { handle: sinon.stub().returns(output) },
        updateRuntime: sinon.stub(),
      };

      const handler = CancelPurchaseHandlerGenerator(utils as any);

      const purchaseResult = { foo: 'bar' };
      const input = { requestEnvelope: { request: { payload: { purchaseResult } } } };
      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.IntentHandler.handle.args).to.eql([[input]]);
      expect(utils.updateRuntime.args[0][0]).to.eql(input);
      // assert updateRuntime callback
      const fn = utils.updateRuntime.args[0][1];
      const runtime = {
        storage: { produce: sinon.stub() },
      };
      fn(runtime);

      const fn2 = runtime.storage.produce.args[0][0];
      const draft = { [S.CANCEL_PAYMENT]: { status: null } };
      fn2(draft);
      expect(draft[S.CANCEL_PAYMENT]).to.eql({ status: purchaseResult });
    });

    it('purchase result is null', async () => {
      const output = 'output';

      const utils = {
        IntentHandler: { handle: sinon.stub().returns(output) },
        updateRuntime: sinon.stub(),
      };

      const handler = CancelPurchaseHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: { payload: { purchaseResult: null } } } };
      expect(await handler.handle(input as any)).to.eql(output);
      // assert updateRuntime callback
      const fn = utils.updateRuntime.args[0][1];
      const runtime = {
        storage: { produce: sinon.stub() },
      };
      fn(runtime);

      const fn2 = runtime.storage.produce.args[0][0];
      const draft = { [S.CANCEL_PAYMENT]: { status: null } };
      fn2(draft);
      expect(draft[S.CANCEL_PAYMENT]).to.eql({ status: false });
    });

    it('no payload', async () => {
      const output = 'output';

      const utils = {
        IntentHandler: { handle: sinon.stub().returns(output) },
        updateRuntime: sinon.stub(),
      };

      const handler = CancelPurchaseHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: {} } };
      expect(await handler.handle(input as any)).to.eql(output);
      // assert updateRuntime callback
      const fn = utils.updateRuntime.args[0][1];
      const runtime = {
        storage: { produce: sinon.stub() },
      };
      fn(runtime);

      const fn2 = runtime.storage.produce.args[0][0];
      const draft = { [S.CANCEL_PAYMENT]: { status: null } };
      fn2(draft);
      expect(draft[S.CANCEL_PAYMENT]).to.eql({ status: false });
    });

    it('no storage payment', async () => {
      const output = 'output';

      const utils = {
        IntentHandler: { handle: sinon.stub().returns(output) },
        updateRuntime: sinon.stub(),
      };

      const handler = CancelPurchaseHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: {} } };
      expect(await handler.handle(input as any)).to.eql(output);
      // assert updateRuntime callback
      const fn = utils.updateRuntime.args[0][1];
      const runtime = {
        storage: { produce: sinon.stub() },
      };
      fn(runtime);

      const fn2 = runtime.storage.produce.args[0][0];
      const draft = { foo: 'bar' };
      fn2(draft);
      expect(draft).to.eql({ foo: 'bar' });
    });
  });
});
