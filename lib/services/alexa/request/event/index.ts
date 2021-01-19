import { RequestHandler } from 'ask-sdk';

import { RequestType } from '@/lib/services/runtime/types';

import { AlexaHandlerInput } from '../../types';
import IntentHandler from '../intent';
import { buildRuntime, initialize } from '../lifecycle';
import handleEvent, { getEvent } from './runtime';

const utilsObj = {
  buildRuntime,
  getEvent,
  initialize,
  IntentHandler,
};

export const EventHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  async canHandle(input: AlexaHandlerInput): Promise<boolean> {
    const runtime = await utils.buildRuntime(input);

    const request = runtime.getRequest();
    if (request?.type !== RequestType.EVENT) return false;

    if (runtime.stack.isEmpty()) {
      await utils.initialize(runtime, input);
      const frame = runtime.stack.getFrames()[0];
      frame.initialize(await runtime.getProgram(frame.getProgramID()));
    }

    console.log('PLEASE', runtime.stack.getFrames());
    return !!utils.getEvent(runtime);
  },
  handle: async (input: AlexaHandlerInput) => {
    // based on the event, modify the runtime
    const runtime = await utils.buildRuntime(input);
    if (runtime.stack.isEmpty()) {
      await utils.initialize(runtime, input);
      const frame = runtime.stack.getFrames()[0];
      frame.initialize(await runtime.getProgram(frame.getProgramID()));
    }

    console.log('handling events');

    await handleEvent(runtime);

    input.attributesManager.setPersistentAttributes(runtime.getRawState());

    return IntentHandler.handle(input);
  },
});

export default EventHandlerGenerator(utilsObj);
