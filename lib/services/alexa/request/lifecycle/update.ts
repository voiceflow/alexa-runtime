import { RepeatType } from '@voiceflow/general-types';

import { S, T, V } from '@/lib/constants';
import { AlexaRuntime } from '@/lib/services/runtime/types';

const update = async (runtime: AlexaRuntime): Promise<void> => {
  const { turn, variables, storage } = runtime;

  const repeatNumber = storage?.get(S.REPEAT);

  // TODO: temporary buffer to update sessions with old numeric repeat type REMOVE SOON
  if (typeof repeatNumber === 'number') {
    let repeat = RepeatType.ALL;
    if (repeatNumber === 0) repeat = RepeatType.OFF;
    else if (repeatNumber < 100) repeat = RepeatType.DIALOG;
    storage.set(S.REPEAT, repeat);
  }

  if (turn.get(T.REQUEST) !== false) {
    turn.set(T.REQUEST, runtime.getRequest());
  }

  variables.set(V.TIMESTAMP, Math.floor(Date.now() / 1000));

  await runtime.update();
};

export default update;
