import { expect } from 'chai';
import sinon from 'sinon';

import LaunchHandler, { LaunchHandlerGenerator, Request } from '@/lib/services/alexa/request/launch';

describe('launch handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(LaunchHandler.canHandle({ requestEnvelope: { request: { type: 'random' } } } as any)).to.eql(false);
    });

    it('true', () => {
      expect(LaunchHandler.canHandle({ requestEnvelope: { request: { type: Request.LAUNCH } } } as any)).to.eql(true);
      expect(LaunchHandler.canHandle({ requestEnvelope: { request: { type: Request.CAN_FULFILL_INTENT } } } as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correclty', async () => {
      const output = 'output';

      const runtime = { foo: 'bar' };

      const utils = {
        buildRuntime: sinon.stub().returns(runtime),
        initialize: sinon.stub(),
        update: sinon.stub(),
        buildResponse: sinon.stub().returns(output),
      };

      const handler = LaunchHandlerGenerator(utils);

      const input = { input: 'obj' };

      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.buildRuntime.args).to.eql([[input]]);
      expect(utils.initialize.args).to.eql([[runtime, input]]);
      expect(utils.update.args).to.eql([[runtime, input]]);
      expect(utils.buildResponse.args).to.eql([[runtime, input]]);
    });
  });
});
