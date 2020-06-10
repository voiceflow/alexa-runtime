import { Store } from '@voiceflow/client';
import { Intent as RequestIntentType } from 'ask-sdk-model';

import { S } from '@/lib/constants';

import log from '../../../../../logger';
import { Fulfillment, Intent, IntentConfig, Slot } from '../../types';

export const checkSupportedSlots = (requestedIntent: RequestIntentType, configs: Fulfillment) => {
  const { slots: requestedSlots, name: requestedIntentName } = requestedIntent;
  const slotConfig = configs[requestedIntentName];

  const requestedSlotKeys = Object.keys(requestedSlots!) || [];
  const slotConfigKeys = Object.keys(slotConfig);

  if (requestedSlotKeys.length) {
    const supportedSlots = requestedSlotKeys.map((key) => {
      const slotData = requestedSlots?.[key]!;
      const slotName = slotData.name;
      const slotValue = slotData.value;

      const slotExistInConfig = slotConfigKeys.includes(slotName) && slotConfig[slotName].length === 0;
      const slotValueExistInConfig = slotConfig[slotName].includes(slotValue);

      return slotExistInConfig || slotValueExistInConfig;
    });

    return supportedSlots.length > 0;
  }

  return false;
};

const getIntentAndSlotsConfig = (storage: Store) => {
  /**
   * Fulfillment contains config for intents and slots associated with intent or slot keys
   * getIntentAndSlotsConfig handler replaces intent and slot keys with their names
   */
  const configs: Fulfillment = {};

  const fulfillmentIntents: Fulfillment = storage.get(S.FULFILLMENT) as Fulfillment;

  Object.keys(fulfillmentIntents).forEach((intentKey) => {
    const intents = storage.get(S.INTENTS) as Intent[];
    const slots = storage.get(S.INTENTS) as Slot[];

    const intentData = intents.find((intent: Intent) => intent.key === intentKey) as Intent;

    const { slot_config: slotConfig }: IntentConfig = fulfillmentIntents[intentKey];

    /**
     * if intent exist then add intent name to the config
     */
    if (intentData) {
      configs[intentData.name] = {};

      /**
       * if slotConfig exists for intent and is not an empty object
       * no empty config object should be sent in the response
       */
      if (slotConfig && !!Object.keys(slotConfig)) {
        const intentConfig: IntentConfig = {};
        Object.keys(slotConfig).forEach((slotKey) => {
          const slotData = slots.find((slot: Slot) => slot.key === slotKey) as Slot;

          intentConfig[slotData.name] = slotConfig[slotKey];
        });

        configs[intentData.name] = slotConfig;
      } else {
        log.warn(`No slot config with intent: ${intentData.name}`);
      }
    }
  });

  return configs;
};

export default getIntentAndSlotsConfig;
