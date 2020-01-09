import { HandlerInput, RequestHandler } from 'ask-sdk';

import { AbstractManager } from '../../utils';

class LaunchHandler extends AbstractManager implements RequestHandler {
  canHandle(input: HandlerInput) {
    const { request } = input.requestEnvelope;
    return request.type === 'LaunchRequest' || (request.type === 'CanFulfillIntentRequest' && request.intent.name === 'InitialIntent');
  }

  async handle(input: HandlerInput) {
    const { voiceflow } = this.services;

    const rawState = await input.attributesManager.getPersistentAttributes();
    const context = voiceflow.createContext(input.requestEnvelope.request.versionID, rawState, input.requestEnvelope.request);

    return null;
  }
}

export default LaunchHandler;
