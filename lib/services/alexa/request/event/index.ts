import { RequestHandler } from 'ask-sdk';

import { AlexaHandlerInput } from '../../types';
import IntentHandler from '../intent';
import { buildRuntime } from '../lifecycle';
import handleEvent, { getEvent } from './runtime';

const utilsObj = {
  buildRuntime,
  getEvent,
  IntentHandler,
};

export const EventHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  async canHandle(input: AlexaHandlerInput): Promise<boolean> {
    const runtime = await utils.buildRuntime(input);

    return !!utils.getEvent(runtime);
  },
  handle: async (input: AlexaHandlerInput) => {
    // based on the event, modify the runtime
    const runtime = await utils.buildRuntime(input);

    await handleEvent(runtime);

    input.attributesManager.setPersistentAttributes(runtime.getRawState());

    return utils.IntentHandler.handle(input);
  },
});

export default EventHandlerGenerator(utilsObj);
