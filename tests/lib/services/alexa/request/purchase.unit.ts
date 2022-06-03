import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import PurchaseHandler, { PurchaseHandlerGenerator, Request } from '@/lib/services/alexa/request/purchase';

describe('purchase handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(
        PurchaseHandler.canHandle({ requestEnvelope: { request: { type: 'random-type', name: 'random-name' } } } as any)
      ).to.eql(false);
    });

    it('true', () => {
      expect(
        PurchaseHandler.canHandle({
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

      const handler = PurchaseHandlerGenerator(utils as any);

      const purchaseResult = { foo: 'bar' };
      const input = { requestEnvelope: { request: { status: { code: 200 }, payload: { purchaseResult } } } };
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
      const draft = { [S.PAYMENT]: { status: null } };
      fn2(draft);
      expect(draft[S.PAYMENT]).to.eql({ status: purchaseResult });
    });

    it('no status', async () => {
      const output = 'output';

      const utils = {
        IntentHandler: { handle: sinon.stub().returns(output) },
        updateRuntime: sinon.stub(),
      };

      const handler = PurchaseHandlerGenerator(utils as any);

      const purchaseResult = { foo: 'bar' };
      const input = { requestEnvelope: { request: { payload: { purchaseResult } } } };
      expect(await handler.handle(input as any)).to.eql(output);
      // assert updateRuntime callback
      const fn = utils.updateRuntime.args[0][1];
      const runtime = {
        storage: { produce: sinon.stub() },
      };
      fn(runtime);

      const fn2 = runtime.storage.produce.args[0][0];
      const draft = { [S.PAYMENT]: { status: null } };
      fn2(draft);
      expect(draft[S.PAYMENT]).to.eql({ status: purchaseResult });
    });

    it('no payload', async () => {
      const output = 'output';

      const utils = {
        IntentHandler: { handle: sinon.stub().returns(output) },
        updateRuntime: sinon.stub(),
      };

      const handler = PurchaseHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: { status: { code: 200 } } } };
      expect(await handler.handle(input as any)).to.eql(output);
      // assert updateRuntime callback
      const fn = utils.updateRuntime.args[0][1];
      const runtime = {
        storage: { produce: sinon.stub() },
      };
      fn(runtime);

      const fn2 = runtime.storage.produce.args[0][0];
      const draft = { [S.PAYMENT]: { status: null } };
      fn2(draft);
      expect(draft[S.PAYMENT]).to.eql({ status: false });
    });

    it('no storage payment', async () => {
      const output = 'output';

      const utils = {
        IntentHandler: { handle: sinon.stub().returns(output) },
        updateRuntime: sinon.stub(),
      };

      const handler = PurchaseHandlerGenerator(utils as any);

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
