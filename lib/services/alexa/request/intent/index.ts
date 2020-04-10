import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, initialize, update } from '../lifecycle';
import behavior from './behavior';

export enum Request {
  INTENT = 'IntentRequest',
}

const utilsObj = {
  buildContext,
  initialize,
  update,
  buildResponse,
  behavior,
};

export const IntentHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.INTENT;
  },
  async handle(input: HandlerInput) {
    const context = await utils.buildContext(input);

    if (context.stack.isEmpty()) {
      await utils.initialize(context, input);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const handler of utils.behavior) {
      if (handler.canHandle(input, context)) {
        return handler.handle(input, context);
      }
    }

    await utils.update(context);

    return utils.buildResponse(context, input);
  },
});

export default IntentHandlerGenerator(utilsObj);
