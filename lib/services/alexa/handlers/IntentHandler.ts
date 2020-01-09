import { HandlerInput, RequestHandler } from 'ask-sdk';

import { AbstractManager } from '../../utils';

class IntentHandler extends AbstractManager implements RequestHandler {
  canHandle(input: HandlerInput): Promise<boolean> | boolean {
    const { request } = input.requestEnvelope;
    return request.type === 'LaunchRequest' || (request.type === 'CanFulfillIntentRequest' && request.intent.name === 'InitialIntent');
  }

  handle(input: HandlerInput): Promise<Response> | Response {
    return undefined;
  }
}

export default IntentHandler;
