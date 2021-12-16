import { RequestHandler } from 'ask-sdk';

import { AlexaHandlerInput } from '../../types';
import IntentHandler from '../intent';
import { buildRuntime, initialize } from '../lifecycle';
import handleEvent, { getEvent } from './runtime';

const utilsObj = {
  getEvent,
  initialize,
  buildRuntime,
  IntentHandler,
};

export const EventHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  async canHandle(input: AlexaHandlerInput): Promise<boolean> {
    const runtime = await utils.buildRuntime(input);

    if (runtime.stack.getSize() === 0) {
      await utils.initialize(runtime, input);
      await runtime.hydrateStack();
    }

    const canHandle = !!utils.getEvent(runtime);
    if (canHandle) input.attributesManager.setPersistentAttributes(runtime.getRawState());

    return canHandle;
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
