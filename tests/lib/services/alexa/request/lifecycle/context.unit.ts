import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import buildContext from '@/lib/services/alexa/request/lifecycle/context';
import { RequestType } from '@/lib/services/voiceflow/types';

describe('context lifecycle unit tests', () => {
  it('no request', async () => {
    const rawState = 'raw-state';
    const context = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('output') },
      turn: { set: sinon.stub() },
    };

    const input = {
      attributesManager: { getPersistentAttributes: sinon.stub().returns(rawState) },
      requestEnvelope: { request: null },
      context: {
        versionID: 'version-id',
        voiceflow: { createContext: sinon.stub().returns(context) },
      },
    };

    expect(await buildContext(input as any)).to.eql(context);
    expect(input.context.voiceflow.createContext.args).to.eql([[input.context.versionID, rawState, undefined]]);
    expect(context.turn.set.args).to.eql([
      [T.HANDLER_INPUT, input],
      [T.PREVIOUS_OUTPUT, 'output'],
    ]);
    expect(context.storage.get.args).to.eql([[S.OUTPUT]]);
    expect(context.storage.set.args).to.eql([[S.OUTPUT, '']]);
  });

  it('no intent', async () => {
    const rawState = 'raw-state';
    const context = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('output') },
      turn: { set: sinon.stub() },
    };

    const input = {
      attributesManager: { getPersistentAttributes: sinon.stub().returns(rawState) },
      requestEnvelope: { request: {} },
      context: {
        versionID: 'version-id',
        voiceflow: { createContext: sinon.stub().returns(context) },
      },
    };

    expect(await buildContext(input as any)).to.eql(context);
    expect(input.context.voiceflow.createContext.args).to.eql([[input.context.versionID, rawState, undefined]]);
  });

  it('with intent', async () => {
    const rawState = 'raw-state';
    const context = {
      storage: { set: sinon.stub(), get: sinon.stub().returns('output') },
      turn: { set: sinon.stub() },
    };

    const input = {
      attributesManager: { getPersistentAttributes: sinon.stub().returns(rawState) },
      requestEnvelope: { request: { intent: 'intent' } },
      context: {
        versionID: 'version-id',
        voiceflow: { createContext: sinon.stub().returns(context) },
      },
    };

    expect(await buildContext(input as any)).to.eql(context);
    expect(input.context.voiceflow.createContext.args).to.eql([
      [input.context.versionID, rawState, { type: RequestType.INTENT, payload: input.requestEnvelope.request }],
    ]);
  });
});
