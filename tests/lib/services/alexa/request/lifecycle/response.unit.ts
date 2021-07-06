import { expect } from 'chai';
import sinon from 'sinon';

import { Event, RequestType } from '@/lib/clients/ingest-client';
import { S, T, V } from '@/lib/constants';
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
    const versionID = 'version.id';
    const runtime = {
      storage: { get: storageGet },
      turn: { get: turnGet, set: sinon.stub() },
      stack: { isEmpty: sinon.stub().returns(true) },
      variables: { get: sinon.stub().returns(false) },
      getFinalState: sinon.stub().returns(finalState),
      services: {
        analyticsClient: {
          identify: sinon.stub(),
          track: sinon.stub(),
        },
      },
      getVersionID: sinon.stub().returns(versionID),
    };
    const accessToken = 'access-token';
    const output = 'output';

    const withShouldEndSession = sinon.stub();
    const reprompt = sinon.stub().returns({ withShouldEndSession });
    const input = {
      responseBuilder: { getResponse: sinon.stub().returns(output), speak: sinon.stub().returns({ reprompt }) },
      requestEnvelope: { runtime: { System: { user: { accessToken } } } },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(runtime as any, input as any)).to.eql(output);
    expect(runtime.turn.set.args).to.eql([[T.END, true]]);
    expect(runtime.storage.get.args).to.eql([[S.OUTPUT], [S.OUTPUT]]);
    expect(runtime.services.analyticsClient.track.args).to.eql([[versionID, Event.INTERACT, RequestType.RESPONSE, output, undefined, finalState]]);
    expect(input.responseBuilder.speak.args).to.eql([['speak']]);
    expect(reprompt.args).to.eql([['speak']]);
    expect(withShouldEndSession.args).to.eql([[true]]);
    expect(responseHandler1.args).to.eql([[runtime, input.responseBuilder]]);
    expect(responseHandler2.args).to.eql([[runtime, input.responseBuilder]]);
    expect(input.attributesManager.setPersistentAttributes.args).to.eql([[finalState]]);
  });

  it('stack not empty', async () => {
    const utils = { responseHandlers: [] };

    const response = responseGenerator(utils);
    const versionID = 'version.id';
    const runtime = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('speak') },
      turn: { get: sinon.stub().returns(true) },
      stack: { isEmpty: sinon.stub().returns(false) },
      variables: { get: sinon.stub().returns(false) },
      getFinalState: sinon.stub().returns({}),
      services: {
        analyticsClient: {
          identify: sinon.stub(),
          track: sinon.stub(),
        },
      },
      getVersionID: sinon.stub().returns(versionID),
    };
    const output = 'output';

    const input = {
      responseBuilder: {
        getResponse: sinon.stub().returns(output),
        speak: sinon.stub().returns({ reprompt: sinon.stub().returns({ withShouldEndSession: sinon.stub() }) }),
      },
      requestEnvelope: { runtime: { System: { user: { accessToken: 'access-token' } } } },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(runtime as any, input as any)).to.eql(output);
    expect(runtime.services.analyticsClient.track.args).to.eql([[versionID, Event.INTERACT, RequestType.RESPONSE, output, undefined, {}]]);
  });

  it('response variable', async () => {
    const utils = { responseHandlers: [] };

    const response = responseGenerator(utils);

    const responseVar = { foo: 'bar', b: 'd', c: null };

    const runtime = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('speak') },
      turn: { get: sinon.stub().returns(true) },
      stack: { isEmpty: sinon.stub().returns(false) },
      variables: { get: sinon.stub().returns(responseVar) },
      getFinalState: sinon.stub().returns({}),
    };
    const output = { a: 'b', b: 'c' };

    const input = {
      responseBuilder: {
        getResponse: sinon.stub().returns(output),
        speak: sinon.stub().returns({ reprompt: sinon.stub().returns({ withShouldEndSession: sinon.stub() }) }),
      },
      requestEnvelope: { runtime: { System: { user: { accessToken: 'access-token' } } } },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(runtime as any, input as any)).to.eql({ ...output, ...responseVar, c: undefined });
    expect(runtime.variables.get.args).to.eql([[V.RESPONSE], [V.RESPONSE]]);
  });
});
