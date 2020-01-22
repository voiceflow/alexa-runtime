import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, launch, update } from './lifecycle';

const IntentHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type === 'IntentRequest' || type.startsWith('PlaybackController');
  },
  async handle(input: HandlerInput) {
    const context = await buildContext(input);

    if (context.stack.isEmpty()) {
      await launch(context, input);
    }

    await update(context);

    return buildResponse(context, input);
  },
};

export default IntentHandler;
