import { HandlerInput, RequestHandler } from 'ask-sdk';

import IntentHandler from '../intent';
import { buildContext } from '../lifecycle';
import handleEvent, { getEvent } from './context';

// export enum Request {
//   INTENT = 'IntentRequest',
// }

const utilsObj = {
  buildContext,
  getEvent,
  // handleEvent,
  IntentHandler,
};

// export const EventHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
//   async canHandle(input: HandlerInput): Promise<boolean> {
//     const context = await utils.buildContext(input);
//     return !!getEvent(context);
//   },
//   async handle(input: HandlerInput) {
//     const context = await utils.buildContext(input);
//     // based on the event, modify the context
//     await handleEvent(context);
//     input.attributesManager.setPersistentAttributes(context.getRawState());

//     return IntentHandler.handle(input);
//   },
// });

export const EventHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  async canHandle(input: HandlerInput): Promise<boolean> {
    const context = await utils.buildContext(input);
    return !!utils.getEvent(context);
  },
  handle: async (input: HandlerInput) => {
    // based on the event, modify the context
    const context = await utils.buildContext(input);
    await handleEvent(context);
    input.attributesManager.setPersistentAttributes(context.getRawState());

    return IntentHandler.handle(input);
  },
});

export default EventHandlerGenerator(utilsObj);
