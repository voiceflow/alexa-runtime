import * as Ingest from '@voiceflow/general-runtime/build/lib/clients/ingest-client';
import { expect } from 'chai';
import sinon from 'sinon';

import { S, T, V } from '@/lib/constants';
import { responseGenerator } from '@/lib/services/alexa/request/lifecycle/response';
import { Request } from '@/lib/services/alexa/types';

describe('response lifecycle unit tests', () => {
  it('works correctly', async () => {
    const responseHandler1 = sinon.stub();
    const responseHandler2 = sinon.stub();

    const utils = { responseHandlers: [responseHandler1, responseHandler2] };

    const response = responseGenerator(utils);

    const finalState = 'final-state';
    const storageGet = sinon.stub().returns('speak');
    const turnGet = sinon.stub();
    turnGet.withArgs(T.REPROMPT).returns(null);
    turnGet.withArgs(T.END).returns(true);
    turnGet.withArgs(T.DELEGATE).returns(false);
    const versionID = 'version.id';
    const turnID = 'turn-id';
    const request = { foo: 'bar' };
    const runtime = {
      getRequest: sinon.stub().returns(request),
      storage: { get: storageGet },
      turn: { get: turnGet, set: sinon.stub() },
      stack: { isEmpty: sinon.stub().returns(true) },
      variables: { get: sinon.stub().returns(false) },
      getFinalState: sinon.stub().returns(finalState),
      services: {
        analyticsClient: {
          track: sinon.stub().resolves(turnID),
        },
      },
      getVersionID: sinon.stub().returns(versionID),
    };
    const accessToken = 'access-token';
    const output = 'output';

    const input = {
      responseBuilder: { getResponse: sinon.stub().returns(output), speak: sinon.stub(), reprompt: sinon.stub(), withShouldEndSession: sinon.stub() },
      requestEnvelope: {
        runtime: { System: { user: { accessToken } } },
        session: { sessionId: 'session.id' },
        request: { type: 'intent' },
      },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(runtime as any, input as any)).to.eql(output);
    const [[{ timestamp }], [{ timestamp: timestamp2 }]] = runtime.services.analyticsClient.track.args;
    expect(runtime.turn.set.args).to.eql([[T.END, true]]);
    expect(runtime.storage.get.args).to.eql([[S.OUTPUT], [S.OUTPUT]]);
    expect(runtime.services.analyticsClient.track.args).to.eql([
      [
        {
          id: versionID,
          event: Ingest.Event.TURN,
          request: Ingest.RequestType.REQUEST,
          payload: request,
          sessionid: input.requestEnvelope.session.sessionId,
          metadata: finalState,
          timestamp,
        },
      ],
      [
        {
          id: versionID,
          event: Ingest.Event.INTERACT,
          request: Ingest.RequestType.RESPONSE,
          payload: output,
          sessionid: input.requestEnvelope.session.sessionId,
          metadata: finalState,
          timestamp: timestamp2,
          turnIDP: turnID,
        },
      ],
    ]);
    expect(input.responseBuilder.speak.args).to.eql([['speak']]);
    expect(input.responseBuilder.reprompt.args).to.eql([['speak']]);
    expect(input.responseBuilder.withShouldEndSession.args).to.eql([[true]]);
    expect(responseHandler1.args).to.eql([[runtime, input.responseBuilder]]);
    expect(responseHandler2.args).to.eql([[runtime, input.responseBuilder]]);
    expect(input.attributesManager.setPersistentAttributes.args).to.eql([[finalState]]);
  });

  it('stack not empty', async () => {
    const utils = { responseHandlers: [] };

    const response = responseGenerator(utils);
    const versionID = 'version.id';
    const turnID = 'turn-id';
    const request = { foo: 'bar' };
    const runtime = {
      getRequest: sinon.stub().returns(request),
      storage: { set: sinon.stub(), get: sinon.stub().returns('speak') },
      turn: {
        get: sinon.stub().returns(true),
      },
      stack: { isEmpty: sinon.stub().returns(false) },
      variables: { get: sinon.stub().returns(false) },
      getFinalState: sinon.stub().returns({}),
      services: {
        analyticsClient: {
          track: sinon.stub().resolves(turnID),
        },
      },
      getVersionID: sinon.stub().returns(versionID),
    };
    const output = 'output';

    const input = {
      responseBuilder: {
        getResponse: sinon.stub().returns(output),
        addDelegateDirective: sinon.stub(),
        speak: sinon.stub(),
        reprompt: sinon.stub(),
        withShouldEndSession: sinon.stub(),
      },
      requestEnvelope: {
        runtime: { System: { user: { accessToken: 'access-token' } } },
        session: { sessionId: 'session.id' },
        request: { type: 'intent' },
      },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(runtime as any, input as any)).to.eql(output);
    const [[{ timestamp }], [{ timestamp: timestamp2 }]] = runtime.services.analyticsClient.track.args;
    expect(runtime.services.analyticsClient.track.args).to.deep.eq([
      [
        {
          id: versionID,
          event: Ingest.Event.TURN,
          request: Ingest.RequestType.REQUEST,
          payload: request,
          sessionid: input.requestEnvelope.session.sessionId,
          metadata: {},
          timestamp,
        },
      ],
      [
        {
          id: versionID,
          event: Ingest.Event.INTERACT,
          request: Ingest.RequestType.RESPONSE,
          payload: output,
          sessionid: input.requestEnvelope.session.sessionId,
          metadata: {},
          timestamp: timestamp2,
          turnIDP: turnID,
        },
      ],
    ]);
  });

  it('response variable', async () => {
    const utils = { responseHandlers: [] };

    const response = responseGenerator(utils);

    const responseVar = { foo: 'bar', b: 'd', c: null };

    const runtime = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('speak') },
      turn: {
        get: sinon
          .stub()
          .returns(true)
          .withArgs(T.DELEGATE)
          .returns(false),
      },
      stack: { isEmpty: sinon.stub().returns(false) },
      variables: { get: sinon.stub().returns(responseVar) },
      getFinalState: sinon.stub().returns({}),
    };
    const output = { a: 'b', b: 'c' };

    const input = {
      responseBuilder: {
        getResponse: sinon.stub().returns(output),
        speak: sinon.stub(),
        reprompt: sinon.stub(),
        withShouldEndSession: sinon.stub(),
      },
      requestEnvelope: { runtime: { System: { user: { accessToken: 'access-token' } } }, request: { type: 'intent' } },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(runtime as any, input as any)).to.eql({ ...output, ...responseVar, c: undefined });
    expect(runtime.variables.get.args).to.eql([[V.RESPONSE], [V.RESPONSE]]);
  });

  it('skips speak if audioplayer event', async () => {
    const utils = { responseHandlers: [] };

    const response = responseGenerator(utils);

    const responseVar = { foo: 'bar', b: 'd', c: null };

    const runtime = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('speak') },
      turn: {
        get: sinon
          .stub()
          .returns(true)
          .withArgs(T.DELEGATE)
          .returns(false),
      },
      stack: { isEmpty: sinon.stub().returns(false) },
      variables: { get: sinon.stub().returns(responseVar) },
      getFinalState: sinon.stub().returns({}),
    };
    const output = { a: 'b', b: 'c' };

    const input = {
      responseBuilder: {
        getResponse: sinon.stub().returns(output),
        speak: sinon.stub(),
        reprompt: sinon.stub(),
        withShouldEndSession: sinon.stub(),
      },
      requestEnvelope: { runtime: { System: { user: { accessToken: 'access-token' } } }, request: { type: Request.AUDIO_PLAYER_PLAYBACK_FAILED } },
      attributesManager: { setPersistentAttributes: sinon.stub() },
    };

    expect(await response(runtime as any, input as any)).to.eql({ ...output, ...responseVar, c: undefined });
    expect(input.responseBuilder.speak.callCount).to.eql(0);
    expect(input.responseBuilder.reprompt.callCount).to.eql(0);
  });
});
