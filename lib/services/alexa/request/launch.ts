import { RequestHandler } from 'ask-sdk';

import { AlexaHandlerInput } from '../types';
import { buildResponse, buildRuntime, initialize, update } from './lifecycle';

export enum Request {
  LAUNCH = 'LaunchRequest',
}

const utilsObj = {
  buildRuntime,
  initialize,
  update,
  buildResponse,
};

export const LaunchHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: AlexaHandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.LAUNCH;
  },
  async handle(input: AlexaHandlerInput) {
    const runtime = await utils.buildRuntime(input);

    await utils.initialize(runtime, input);

    await utils.update(runtime);

    return utils.buildResponse(runtime, input);
  },
});

export default LaunchHandlerGenerator(utilsObj);
