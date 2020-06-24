import { Context } from '@voiceflow/client';

import { F, S, T } from '@/lib/constants';

import { IntentName, IntentRequest } from '../types';

const RepeatHandler = {
  canHandle: (context: Context): boolean => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;
    const repeat = context.storage.get(S.REPEAT);
    return repeat > 0 && request?.payload.intent.name === IntentName.REPEAT;
  },
  handle: (context: Context) => {
    const repeat = context.storage.get(S.REPEAT);
    const top = context.stack.top();

    const output = (repeat === 100 ? context.turn.get(T.PREVIOUS_OUTPUT) : top.storage.get(F.SPEAK)) || '';

    context.storage.produce((draft) => {
      draft[S.OUTPUT] += output;
    });

    return top.getBlockID() || null;
  },
};

export default () => RepeatHandler;
