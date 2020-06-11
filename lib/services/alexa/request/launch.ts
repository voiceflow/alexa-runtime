import { HandlerInput, RequestHandler } from 'ask-sdk';

import { Request } from '../types';
import { buildContext, buildResponse, initialize, update } from './lifecycle';

const utilsObj = {
  buildContext,
  initialize,
  update,
  buildResponse,
};

export const LaunchHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.LAUNCH;
  },
  async handle(input: HandlerInput) {
    const context = await utils.buildContext(input);

    await utils.initialize(context, input);

    await utils.update(context);

    return utils.buildResponse(context, input);
  },
});

export default LaunchHandlerGenerator(utilsObj);
