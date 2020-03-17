import { expect } from 'chai';
import sinon from 'sinon';

import ErrorHandler from '@/lib/services/alexa/handlers/error';

describe('error handler unit tests', () => {
  describe('canHandle', () => {
    it('works', () => {
      expect(ErrorHandler.canHandle(null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', () => {
      const output = 'output';
      const getResponse = sinon.stub().returns(output);
      const withShouldEndSession = sinon.stub().returns({ getResponse });
      const reprompt = sinon.stub().returns({ withShouldEndSession });
      const input = { responseBuilder: { speak: sinon.stub().returns({ reprompt }) }, requestEnvelope: { request: {} } };

      expect(ErrorHandler.handle(input as any, null as any)).to.eql(output);
    });
  });
});
