import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import buildRuntime from '@/lib/services/alexa/request/lifecycle/runtime';
import { Request } from '@/lib/services/alexa/types';
import { RequestType } from '@/lib/services/runtime/types';

describe('runtime lifecycle unit tests', () => {
  it('no request', async () => {
    const rawState = 'raw-state';
    const runtime = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('output') },
      turn: { set: sinon.stub() },
      setEvent: sinon.stub(),
    };

    const accessToken = 'access-token';
    const input = {
      attributesManager: { getPersistentAttributes: sinon.stub().returns(rawState) },
      requestEnvelope: { request: null, context: { System: { user: { accessToken } } } },
      context: {
        versionID: 'version-id',
        runtimeClient: { createRuntime: sinon.stub().returns(runtime) },
      },
    };

    expect(await buildRuntime(input as any)).to.eql(runtime);
    expect(input.context.runtimeClient.createRuntime.args).to.eql([[input.context.versionID, rawState, undefined]]);
    expect(runtime.turn.set.args).to.eql([
      [T.HANDLER_INPUT, input],
      [T.PREVIOUS_OUTPUT, 'output'],
    ]);
    expect(runtime.storage.get.args).to.eql([[S.OUTPUT]]);
    expect(runtime.storage.set.args).to.eql([
      [S.OUTPUT, ''],
      [S.ACCESS_TOKEN, accessToken],
    ]);
    expect(runtime.setEvent.args[0][0]).to.eql('stateDidCatch');
    expect(runtime.setEvent.args[1][0]).to.eql('handlerDidCatch');
  });

  it('with event', async () => {
    const rawState = 'raw-state';
    const runtime = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('output') },
      turn: { set: sinon.stub() },
      setEvent: sinon.stub(),
    };

    const input = {
      attributesManager: { getPersistentAttributes: sinon.stub().returns(rawState) },
      requestEnvelope: { request: { type: 'randomEvent', foo: 'bar' }, context: { System: { user: {} } } },
      context: {
        versionID: 'version-id',
        runtimeClient: { createRuntime: sinon.stub().returns(runtime) },
      },
    };

    expect(await buildRuntime(input as any)).to.eql(runtime);
    expect(input.context.runtimeClient.createRuntime.args).to.eql([
      [input.context.versionID, rawState, { type: RequestType.EVENT, payload: { event: 'randomEvent', data: input.requestEnvelope.request } }],
    ]);
    expect(runtime.setEvent.args[0][0]).to.eql('stateDidCatch');
    expect(runtime.setEvent.args[1][0]).to.eql('handlerDidCatch');
  });

  it('with intent', async () => {
    const rawState = 'raw-state';
    const runtime = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('output') },
      turn: { set: sinon.stub() },
      setEvent: sinon.stub(),
    };

    const input = {
      attributesManager: { getPersistentAttributes: sinon.stub().returns(rawState) },
      requestEnvelope: { request: { intent: 'intent', type: Request.INTENT }, context: { System: { user: {} } } },
      context: {
        versionID: 'version-id',
        runtimeClient: { createRuntime: sinon.stub().returns(runtime) },
      },
    };

    expect(await buildRuntime(input as any)).to.eql(runtime);
    expect(input.context.runtimeClient.createRuntime.args).to.eql([
      [input.context.versionID, rawState, { type: RequestType.INTENT, payload: input.requestEnvelope.request }],
    ]);
    expect(runtime.setEvent.args[0][0]).to.eql('stateDidCatch');
    expect(runtime.setEvent.args[1][0]).to.eql('handlerDidCatch');
  });
});
