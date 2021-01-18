import { RepeatType } from '@voiceflow/general-types';
import { Runtime } from '@voiceflow/runtime';

import { F, S, T } from '@/lib/constants';

import { IntentName, IntentRequest } from '../types';

const RepeatHandler = {
  canHandle: (runtime: Runtime): boolean => {
    const request = runtime.turn.get<IntentRequest>(T.REQUEST);
    const repeat = runtime.storage.get<RepeatType>(S.REPEAT);

    return !!repeat && request?.payload.intent.name === IntentName.REPEAT && [RepeatType.ALL, RepeatType.DIALOG].includes(repeat);
  },
  handle: (runtime: Runtime) => {
    const repeat = runtime.storage.get<RepeatType>(S.REPEAT);
    const top = runtime.stack.top();

    const output = (repeat === RepeatType.ALL ? runtime.turn.get(T.PREVIOUS_OUTPUT) : top.storage.get(F.SPEAK)) || '';

    runtime.storage.produce<{ [S.OUTPUT]: string }>((draft) => {
      draft[S.OUTPUT] += output;
    });

    return top.getNodeID() || null;
  },
};

export default () => RepeatHandler;
