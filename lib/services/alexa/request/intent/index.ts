import { RequestHandler } from 'ask-sdk';

import log from '@/logger';

import { AlexaHandlerInput, Request } from '../../types';
import { buildResponse, buildRuntime, initialize, update } from '../lifecycle';
import behavior from './behavior';

const utilsObj = {
  buildRuntime,
  initialize,
  update,
  buildResponse,
  behavior,
};

export const IntentHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: AlexaHandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.INTENT;
  },
  async handle(input: AlexaHandlerInput) {
    const runtime = await utils.buildRuntime(input);

    if (runtime.stack.isEmpty()) {
      await utils.initialize(runtime, input);
    }

    if (runtime.versionID === '6041446c8f74b3001c175b5c') {
      log.warn('BEFORE 6041446c8f74b3001c175b5c stack=%s', JSON.stringify(runtime.stack.getState()));
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const handler of utils.behavior) {
      if (handler.canHandle(input, runtime)) {
        return handler.handle(input, runtime);
      }
    }

    await utils.update(runtime);

    if (runtime.versionID === '6041446c8f74b3001c175b5c') {
      log.warn('AFTER 6041446c8f74b3001c175b5c stack=%s', JSON.stringify(runtime.stack.getState()));
    }

    return utils.buildResponse(runtime, input);
  },
});

export default IntentHandlerGenerator(utilsObj);
