import { HandlerInput, RequestHandler } from 'ask-sdk';
import { canfulfill } from 'ask-sdk-model';

import { Fulfillment } from '../../types';
import { buildContext, buildResponse, initialize, update } from '../lifecycle';
import getIntentAndSlotsConfig, { checkSupportedSlots } from './configs';

export enum Request {
  CAN_FULFILL_INTENT = 'CanFulfillIntentRequest',
}

export enum CanFulfillType {
  YES = 'YES',
  NO = 'NO',
}

const utilsObj = {
  buildContext,
  initialize,
  update,
  buildResponse,
};

export const CanFulfillmaneRequestHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle: (input: HandlerInput): boolean => {
    const { type } = input.requestEnvelope.request;

    return type === Request.CAN_FULFILL_INTENT;
  },
  async handle(input: HandlerInput) {
    const context = await utils.buildContext(input);
    const { request } = input.requestEnvelope;

    await utils.initialize(context, input);

    const { storage } = context;

    const canfulfillConfigs = getIntentAndSlotsConfig(storage) as Fulfillment;
    const canFulfillIntentBody: any = {};

    const { intent: requestedIntent } = request as canfulfill.CanFulfillIntentRequest;

    /**
     * if requested intent name is not valid or does not exist on canfulfillConfigs, skill does not support canfulfillment request
     */
    if (!requestedIntent.name || canfulfillConfigs[requestedIntent.name]) {
      canFulfillIntentBody.canFulfill = CanFulfillType.NO;
    } else if (!checkSupportedSlots(requestedIntent, canfulfillConfigs)) {
      /**
       * can not fulfill request if slot are not supported or exist
       */
      canFulfillIntentBody.canFulfill = CanFulfillType.NO;
    } else {
      /**
       * request does contain intent and a slots
       * requested slots and intents are supported
       */
      const { slots: requestedSlots } = requestedIntent;
      const requestedSlotKeys = Object.keys(requestedSlots!) || [];
      const canFulfillSlots: any = {};

      requestedSlotKeys.map((key) => {
        const { name } = requestedSlots?.[key]!;

        canFulfillSlots[name] = {
          canUnderstand: 'YES',
          canFulfill: 'YES',
        };
      });

      canFulfillIntentBody.canFulfill = CanFulfillType.YES;
      canFulfillIntentBody.slots = canFulfillSlots;
    }

    return input.responseBuilder.withCanFulfillIntent(canFulfillIntentBody as canfulfill.CanFulfillIntent).getResponse();
  },
});

export default CanFulfillmaneRequestHandlerGenerator(utilsObj);
