import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, launch } from './lifecycle';

const IntentHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type === 'IntentRequest' || type.startsWith('PlaybackController');
  },
  async handle(input: HandlerInput) {
    const context = await buildContext(input, null);

    if (context.stack.getSize() === 0) {
      launch(context, input);
    }

    context.update();

    return buildResponse(context, input);
  },
};

export default IntentHandler;
