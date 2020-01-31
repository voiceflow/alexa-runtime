import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, launch, update } from './lifecycle';

const LaunchHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type === 'LaunchRequest' || type === 'CanFulfillIntentRequest';
  },
  async handle(input: HandlerInput) {
    const context = await buildContext(input);
    await launch(context, input);

    await update(context);

    return buildResponse(context, input);
  },
};

export default LaunchHandler;
