import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, initialize, update } from './lifecycle';

enum Request {
  INTENT = 'IntentRequest',
}

const IntentHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.INTENT;
  },
  async handle(input: HandlerInput) {
    const context = await buildContext(input);

    if (context.stack.isEmpty()) {
      await initialize(context, input);
    }

    await update(context);

    return buildResponse(context, input);
  },
};

export default IntentHandler;
