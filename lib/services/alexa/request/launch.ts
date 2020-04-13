import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, initialize, update } from './lifecycle';

export enum Request {
  LAUNCH = 'LaunchRequest',
  CAN_FULFILL_INTENT = 'CanFulfillIntentRequest',
}

const utilsObj = {
  buildContext,
  initialize,
  update,
  buildResponse,
};

export const LaunchHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.LAUNCH || type === Request.CAN_FULFILL_INTENT;
  },
  async handle(input: HandlerInput) {
    const context = await utils.buildContext(input);

    await utils.initialize(context, input);

    await utils.update(context);

    return utils.buildResponse(context, input);
  },
});

export default LaunchHandlerGenerator(utilsObj);
