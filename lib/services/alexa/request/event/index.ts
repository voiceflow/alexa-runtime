import { HandlerInput, RequestHandler } from 'ask-sdk';

import IntentHandler from '../intent';
import behavior from '../intent/behavior';
import { buildContext, buildResponse, initialize, update } from '../lifecycle';
import handleEvent, { getEvent } from './context';

export enum Request {
  INTENT = 'IntentRequest',
}

const utilsObj = {
  buildContext,
  initialize,
  update,
  buildResponse,
  behavior,
  getEvent,
  handleEvent,
  IntentHandler,
};

export const EventHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  async canHandle(input: HandlerInput): Promise<boolean> {
    const context = await utils.buildContext(input);
    return !!getEvent(context);
  },
  async handle(input: HandlerInput) {
    const context = await utils.buildContext(input);
    // based on the event, modify the context
    await handleEvent(context);
    input.attributesManager.setPersistentAttributes(context.getRawState());

    return IntentHandler.handle(input);
  },
});

export default EventHandlerGenerator(utilsObj);
