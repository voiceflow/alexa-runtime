import { BaseVersion } from '@voiceflow/base-types';
import { Runtime } from '@voiceflow/general-runtime/build/runtime';

import { F, S, T } from '@/lib/constants';
import { addOutput } from '@/lib/services/runtime/handlers/utils/output';

import { IntentName, IntentRequest } from '../types';

const RepeatHandler = {
  canHandle: (runtime: Runtime): boolean => {
    const request = runtime.turn.get<IntentRequest>(T.REQUEST);
    const repeat = runtime.storage.get<BaseVersion.RepeatType>(S.REPEAT);

    return (
      !!repeat &&
      request?.payload.intent.name === IntentName.REPEAT &&
      [BaseVersion.RepeatType.ALL, BaseVersion.RepeatType.DIALOG].includes(repeat)
    );
  },
  handle: (runtime: Runtime) => {
    const repeat = runtime.storage.get<BaseVersion.RepeatType>(S.REPEAT);
    const top = runtime.stack.top();

    const output: string =
      (repeat === BaseVersion.RepeatType.ALL ? runtime.turn.get(T.PREVIOUS_OUTPUT) : top.storage.get(F.SPEAK)) || '';

    addOutput(output, runtime);

    return top.getNodeID() || null;
  },
};

export default () => RepeatHandler;
