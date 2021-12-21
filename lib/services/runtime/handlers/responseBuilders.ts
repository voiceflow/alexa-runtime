import { Intent } from 'ask-sdk-model';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

// response builder shared between multiple nodes

export const DelegateResponseBuilder: ResponseBuilder = (runtime, builder) => {
  const delegate = runtime.turn.get<Intent>(T.DELEGATE);
  if (delegate) {
    builder.addDelegateDirective(delegate);
  }
};

export interface TurnElicitSlot {
  slot: string;
  intent: Intent;
}
export const ElicitSlotResponseBuilder: ResponseBuilder = (runtime, builder) => {
  const elicit = runtime.turn.get<{ slot: string; intent: Intent }>(T.ELICIT_SLOT);
  if (elicit?.slot) {
    builder.addElicitSlotDirective(elicit.slot, elicit.intent);
  }
};
