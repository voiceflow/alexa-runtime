import { RequestHandler } from 'ask-sdk';

import log from '@/logger';

import { AlexaHandlerInput } from '../types';
import { buildResponse, buildRuntime, initialize, update } from './lifecycle';

export enum Request {
  LAUNCH = 'LaunchRequest',
  CAN_FULFILL_INTENT = 'CanFulfillIntentRequest',
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

    return type === Request.LAUNCH || type === Request.CAN_FULFILL_INTENT;
  },
  async handle(input: AlexaHandlerInput) {
    const runtime = await utils.buildRuntime(input);

    if (runtime.versionID === '6041446c8f74b3001c175b5c') {
      log.warn('BEFORE 6041446c8f74b3001c175b5c stack=%s', JSON.stringify(runtime.stack.getState()));
    }

    await utils.initialize(runtime, input);

    await utils.update(runtime);

    if (runtime.versionID === '6041446c8f74b3001c175b5c') {
      log.warn('AFTER 6041446c8f74b3001c175b5c stack=%s', JSON.stringify(runtime.stack.getState()));
    }

    return utils.buildResponse(runtime, input);
  },
});

export default LaunchHandlerGenerator(utilsObj);
