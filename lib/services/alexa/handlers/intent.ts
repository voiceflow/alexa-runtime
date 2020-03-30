import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, initialize, update } from './lifecycle';

export enum Request {
  INTENT = 'IntentRequest',
}

const utilsObj = {
  buildContext,
  initialize,
  update,
  buildResponse,
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

    await utils.update(context);

    return utils.buildResponse(context, input);
  },
});

export default IntentHandlerGenerator(utilsObj);
