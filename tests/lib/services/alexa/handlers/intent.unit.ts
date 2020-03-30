import { expect } from 'chai';
import sinon from 'sinon';

import IntentHandler, { IntentHandlerGenerator, Request } from '@/lib/services/alexa/handlers/intent';

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
      };
      const handler = IntentHandlerGenerator(utils);

      const input = { foo: 'bar' };

      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.initialize.callCount).to.eql(0);
    });
  });
});
