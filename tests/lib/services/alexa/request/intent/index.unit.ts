import { expect } from 'chai';
import sinon from 'sinon';

import IntentHandler, { IntentHandlerGenerator } from '@/lib/services/alexa/request/intent';
import { Request } from '@/lib/services/alexa/types';

describe('intent handler unit tests', () => {
  describe('canHandle', () => {
    it('returns true', () => {
      const input = { requestEnvelope: { request: { type: 'random-type' } } };
      expect(IntentHandler.canHandle(input as any)).to.eql(false);
    });

    it('returns false', () => {
      const input = { requestEnvelope: { request: { type: Request.INTENT } } };
      expect(IntentHandler.canHandle(input as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('stack empty', async () => {
      const output = 'output';
      const runtime = { stack: { isEmpty: sinon.stub().returns(true) } };

      const utils = {
        buildRuntime: sinon.stub().resolves(runtime),
        initialize: sinon.stub(),
        update: sinon.stub(),
        buildResponse: sinon.stub().resolves(output),
        behavior: [],
      };
      const handler = IntentHandlerGenerator(utils);

      const input = { foo: 'bar' };

      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.buildRuntime.args).to.eql([[input]]);
      expect(utils.initialize.args).to.eql([[runtime, input]]);
      expect(utils.update.args).to.eql([[runtime, input]]);
      expect(utils.buildResponse.args).to.eql([[runtime, input]]);
    });

    it('stack not empty', async () => {
      const output = 'output';
      const runtime = { stack: { isEmpty: sinon.stub().returns(false) } };

      const utils = {
        buildRuntime: sinon.stub().resolves(runtime),
        initialize: sinon.stub(),
        update: sinon.stub(),
        buildResponse: sinon.stub().resolves(output),
        behavior: [],
      };
      const handler = IntentHandlerGenerator(utils);

      const input = { foo: 'bar' };

      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.initialize.callCount).to.eql(0);
    });

    it('handles behavior', async () => {
      const output = 'output';
      const runtime = { stack: { isEmpty: sinon.stub().returns(false) } };

      const utils = {
        buildRuntime: sinon.stub().resolves(runtime),
        initialize: sinon.stub(),
        update: sinon.stub(),
        buildResponse: sinon.stub(),
        behavior: [
          { canHandle: sinon.stub().returns(false), handle: sinon.stub() },
          { canHandle: sinon.stub().returns(true), handle: sinon.stub().resolves(output) },
          { canHandle: sinon.stub(), handle: sinon.stub() },
        ],
      };
      const handler = IntentHandlerGenerator(utils);

      const input = { foo: 'bar' };

      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.initialize.callCount).to.eql(0);
      expect(utils.behavior[0].canHandle.callCount).to.eql(1);
      expect(utils.behavior[0].handle.callCount).to.eql(0);
      expect(utils.behavior[1].canHandle.callCount).to.eql(1);
      expect(utils.behavior[1].handle.callCount).to.eql(1);
      expect(utils.behavior[2].canHandle.callCount).to.eql(0);
      expect(utils.behavior[2].handle.callCount).to.eql(0);
    });
  });
});
