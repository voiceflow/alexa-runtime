import { HandlerInput, RequestHandler } from 'ask-sdk';

import { Request } from '../../types';
import { buildContext, buildResponse, initialize, update } from '../lifecycle';
import behavior from './behavior';

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
    console.log('intent handler - canHandle', type);

    return type === Request.INTENT;
  },
  async handle(input: HandlerInput) {
    const context = await utils.buildContext(input);

    console.log('in intent handler');
    // console.log('input', input);

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
