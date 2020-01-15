import { Store } from '@voiceflow/client';
import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, launch, update } from './lifecycle';

const LaunchHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type === 'LaunchRequest' || type === 'CanFulfillIntentRequest';
  },
  async handle(input: HandlerInput) {
    const { type, ...payload } = input.requestEnvelope.request as any;
    const context = await buildContext(input, { type, payload: new Store(payload) });
    await launch(context, input);

    await update(context);

    return buildResponse(context, input);
  },
};

export default LaunchHandler;
