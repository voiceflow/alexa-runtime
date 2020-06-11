import { expect } from 'chai';
import sinon from 'sinon';

import LaunchHandler, { LaunchHandlerGenerator } from '@/lib/services/alexa/request/launch';
import { Request } from '@/lib/services/alexa/types';

describe('launch handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(LaunchHandler.canHandle({ requestEnvelope: { request: { type: 'random' } } } as any)).to.eql(false);
      expect(LaunchHandler.canHandle({ requestEnvelope: { request: { type: Request.CAN_FULFILL_INTENT } } } as any)).to.eql(false);
    });

    it('true', () => {
      expect(LaunchHandler.canHandle({ requestEnvelope: { request: { type: Request.LAUNCH } } } as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correclty', async () => {
      const output = 'output';

      const context = { foo: 'bar' };

      const utils = {
        buildContext: sinon.stub().returns(context),
        initialize: sinon.stub(),
        update: sinon.stub(),
        buildResponse: sinon.stub().returns(output),
      };

      const handler = LaunchHandlerGenerator(utils);

      const input = { input: 'obj' };

      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.buildContext.args).to.eql([[input]]);
      expect(utils.initialize.args).to.eql([[context, input]]);
      expect(utils.update.args).to.eql([[context]]);
      expect(utils.buildResponse.args).to.eql([[context, input]]);
    });
  });
});
