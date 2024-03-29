import { RequestHandler } from 'ask-sdk';
import { canfulfill } from 'ask-sdk-model';

import { AlexaHandlerInput } from '../types';

export enum Request {
  CAN_FULFILL_INTENT = 'CanFulfillIntentRequest',
}

export const CanFulfillIntentHandler = (): RequestHandler => ({
  canHandle(input: AlexaHandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.CAN_FULFILL_INTENT;
  },
  async handle(input: AlexaHandlerInput) {
    const { intent } = input.requestEnvelope.request as canfulfill.CanFulfillIntentRequest;

    const version = await input.context.api.getVersion(input.context.versionID);

    const existingIntent = version.platformData?.intents?.find?.((_intent) => _intent.name === intent.name);

    const hasSlots = Object.keys(intent.slots ?? {}).map((slotName) => {
      const hasSlot =
        !!existingIntent &&
        !!version.platformData?.slots?.find?.(
          (_slot) => existingIntent.slots?.find((intentSlot) => _slot.key === intentSlot.id) && _slot.name === slotName
        );
      return [slotName, hasSlot] as const;
    });

    const canFulfill = !!existingIntent && hasSlots.every(([, hasSlot]) => hasSlot);

    const response = input.responseBuilder.withCanFulfillIntent({
      canFulfill: canFulfill ? 'YES' : 'NO',
      slots: Object.fromEntries(
        hasSlots.map(([slotName, hasSlot]) => [
          slotName,
          {
            canUnderstand: hasSlot ? 'YES' : 'NO',
            canFulfill: hasSlot ? 'YES' : 'NO',
          },
        ])
      ),
    });

    return response.getResponse();
  },
});

export default CanFulfillIntentHandler();
