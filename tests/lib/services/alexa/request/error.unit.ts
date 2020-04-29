import { expect } from 'chai';
import sinon from 'sinon';

import ErrorHandlerGenerator from '@/lib/services/alexa/request/error';

describe('error handler unit tests', () => {
  describe('canHandle', () => {
    it('works', () => {
      expect(ErrorHandlerGenerator(null as any).canHandle(null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', () => {
      const output = 'output';
      const decodedVersionID = 1;
      const getResponse = sinon.stub().returns(output);
      const withShouldEndSession = sinon.stub().returns({ getResponse });
      const reprompt = sinon.stub().returns({ withShouldEndSession });
      const input = {
        context: { decodedVersionID },
        responseBuilder: { speak: sinon.stub().returns({ reprompt }) },
        requestEnvelope: { request: {} },
      };

      const metrics = { increment: sinon.stub() };
      expect(ErrorHandlerGenerator(metrics as any).handle(input as any, null as any)).to.eql(output);
      expect(metrics.increment.args).to.eql([['alexa.request.error', 1, [`skill_id:${decodedVersionID}`]]]);
    });
  });
});
