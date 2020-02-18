import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, initialize, update } from './lifecycle';

enum Request {
  LAUNCH = 'LaunchRequest',
  CAN_FULFILL_INTENT = 'CanFulfillIntentRequest',
}

const LaunchHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.LAUNCH || type === Request.CAN_FULFILL_INTENT;
  },
  async handle(input: HandlerInput) {
    const context = await buildContext(input);

    await initialize(context, input);

    await update(context);

    return buildResponse(context, input);
  },
};

export default LaunchHandler;
