import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import { responseGenerator } from '@/lib/services/alexa/request/lifecycle/response';

describe('response lifecycle unit tests', () => {
  it('works correctly', async () => {
    const responseHandler1 = sinon.stub();
    const responseHandler2 = sinon.stub();

    const utils = { responseHandlers: [responseHandler1, responseHandler2] };

    const response = responseGenerator(utils);

    const finalState = 'final-state';
    const storageGet = sinon.stub().returns('speak');
    const turnGet = sinon.stub();
    turnGet.onFirstCall().returns(null);
    turnGet.onSecondCall().returns(true);

    const context = {
      storage: { get: storageGet },
      turn: { get: turnGet, set: sinon.stub() },
      stack: { isEmpty: sinon.stub().returns(true) },
      getFinalState: sinon.stub().returns(finalState),
    };
    const accessToken = 'access-token';
    const output = 'output';

    const withShouldEndSession = sinon.stub();
    const reprompt = sinon.stub().returns({ withShouldEndSession });
    const input = {
      responseBuilder: { getResponse: sinon.stub().returns(output), speak: sinon.stub().returns({ reprompt }) },
      requestEnvelope: { context: { System: { user: { accessToken } } } },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(context as any, input as any)).to.eql(output);
    expect(context.turn.set.args).to.eql([[T.END, true]]);
    expect(context.storage.get.args).to.eql([[S.OUTPUT], [S.OUTPUT]]);
    expect(input.responseBuilder.speak.args).to.eql([['speak']]);
    expect(reprompt.args).to.eql([['speak']]);
    expect(withShouldEndSession.args).to.eql([[true]]);
    expect(responseHandler1.args).to.eql([[context, input.responseBuilder]]);
    expect(responseHandler2.args).to.eql([[context, input.responseBuilder]]);
    expect(input.attributesManager.setPersistentAttributes.args).to.eql([[finalState]]);
  });

  it('stack not empty', async () => {
    const utils = { responseHandlers: [] };

    const response = responseGenerator(utils);

    const context = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('speak') },
      turn: { get: sinon.stub().returns(true) },
      stack: { isEmpty: sinon.stub().returns(false) },
      getFinalState: sinon.stub().returns({}),
    };
    const output = 'output';

    const input = {
      responseBuilder: {
        getResponse: sinon.stub().returns(output),
        speak: sinon.stub().returns({ reprompt: sinon.stub().returns({ withShouldEndSession: sinon.stub() }) }),
      },
      requestEnvelope: { context: { System: { user: { accessToken: 'access-token' } } } },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(context as any, input as any)).to.eql(output);
  });
});
