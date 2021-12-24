import { Intent } from 'ask-sdk-model';

import { TurnElicitSlot } from '../responseBuilders';

export const createDelegateIntent = (intentName: string, slots: string[] = []): Intent => ({
  name: intentName,
  confirmationStatus: 'NONE',
  slots: slots.reduce(
    (acc, slotName) => ({
      ...acc,
      [slotName]: {
        name: slotName,
        value: '',
        resolutions: {},
        confirmationStatus: 'NONE',
      },
    }),
    {}
  ),
});

export const createElicitSlot = (intentName: string, slots: string[]): TurnElicitSlot => ({
  slot: slots[0],
  intent: createDelegateIntent(intentName, slots),
});
