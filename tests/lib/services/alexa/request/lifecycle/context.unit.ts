import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import buildContext from '@/lib/services/alexa/request/lifecycle/context';
import { Request } from '@/lib/services/alexa/types';
import { RequestType } from '@/lib/services/runtime/types';

describe('context lifecycle unit tests', () => {
  it('no request', async () => {
    const rawState = 'raw-state';
    const context = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('output') },
      turn: { set: sinon.stub() },
    };

    const accessToken = 'access-token';
    const input = {
      attributesManager: { getPersistentAttributes: sinon.stub().returns(rawState) },
      requestEnvelope: { request: null, context: { System: { user: { accessToken } } } },
      context: {
        versionID: 'version-id',
        voiceflow: { createRuntime: sinon.stub().returns(context) },
      },
    };

    expect(await buildContext(input as any)).to.eql(context);
    expect(input.context.voiceflow.createRuntime.args).to.eql([[input.context.versionID, rawState, undefined]]);
    expect(context.turn.set.args).to.eql([
      [T.HANDLER_INPUT, input],
      [T.PREVIOUS_OUTPUT, 'output'],
    ]);
    expect(context.storage.get.args).to.eql([[S.OUTPUT]]);
    expect(context.storage.set.args).to.eql([
      [S.OUTPUT, ''],
      [S.ACCESS_TOKEN, accessToken],
    ]);
  });

  it('with event', async () => {
    const rawState = 'raw-state';
    const context = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('output') },
      turn: { set: sinon.stub() },
    };

    const input = {
      attributesManager: { getPersistentAttributes: sinon.stub().returns(rawState) },
      requestEnvelope: { request: { type: 'randomEvent', foo: 'bar' }, context: { System: { user: {} } } },
      context: {
        versionID: 'version-id',
        voiceflow: { createRuntime: sinon.stub().returns(context) },
      },
    };

    expect(await buildContext(input as any)).to.eql(context);
    expect(input.context.voiceflow.createRuntime.args).to.eql([
      [input.context.versionID, rawState, { type: RequestType.EVENT, payload: { event: 'randomEvent', data: input.requestEnvelope.request } }],
    ]);
  });

  it('with intent', async () => {
    const rawState = 'raw-state';
    const context = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('output') },
      turn: { set: sinon.stub() },
    };

    const input = {
      attributesManager: { getPersistentAttributes: sinon.stub().returns(rawState) },
      requestEnvelope: { request: { intent: 'intent', type: Request.INTENT }, context: { System: { user: {} } } },
      context: {
        versionID: 'version-id',
        voiceflow: { createRuntime: sinon.stub().returns(context) },
      },
    };

    expect(await buildContext(input as any)).to.eql(context);
    expect(input.context.voiceflow.createRuntime.args).to.eql([
      [input.context.versionID, rawState, { type: RequestType.INTENT, payload: input.requestEnvelope.request }],
    ]);
  });
});
