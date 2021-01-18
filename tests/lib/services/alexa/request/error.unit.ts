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
      const versionID = '1';
      const getResponse = sinon.stub().returns(output);
      const withShouldEndSession = sinon.stub().returns({ getResponse });
      const reprompt = sinon.stub().returns({ withShouldEndSession });
      const input = {
        context: { versionID },
        responseBuilder: { speak: sinon.stub().returns({ reprompt }) },
        requestEnvelope: { request: {} },
      };

      const metrics = { error: sinon.stub() };
      expect(ErrorHandlerGenerator(metrics as any).handle(input as any, null as any)).to.eql(output);
      expect(metrics.error.args).to.eql([[versionID]]);
    });
  });
});
