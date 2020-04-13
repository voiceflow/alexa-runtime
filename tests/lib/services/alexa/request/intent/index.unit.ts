import { expect } from 'chai';
import sinon from 'sinon';

import IntentHandler, { IntentHandlerGenerator, Request } from '@/lib/services/alexa/request/intent';

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
      const context = { stack: { isEmpty: sinon.stub().returns(true) } };

      const utils = {
        buildContext: sinon.stub().resolves(context),
        initialize: sinon.stub(),
        update: sinon.stub(),
        buildResponse: sinon.stub().resolves(output),
        behavior: [],
      };
      const handler = IntentHandlerGenerator(utils);

      const input = { foo: 'bar' };

      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.buildContext.args).to.eql([[input]]);
      expect(utils.initialize.args).to.eql([[context, input]]);
      expect(utils.update.args).to.eql([[context]]);
      expect(utils.buildResponse.args).to.eql([[context, input]]);
    });

    it('stack not empty', async () => {
      const output = 'output';
      const context = { stack: { isEmpty: sinon.stub().returns(false) } };

      const utils = {
        buildContext: sinon.stub().resolves(context),
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
      const context = { stack: { isEmpty: sinon.stub().returns(false) } };

      const utils = {
        buildContext: sinon.stub().resolves(context),
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
