import { Version as BaseVersion } from '@voiceflow/base-types';

import { S, T, V } from '@/lib/constants';
import { AlexaRuntime } from '@/lib/services/runtime/types';

const update = async (runtime: AlexaRuntime): Promise<void> => {
  const { turn, variables, storage } = runtime;
  const repeatNumber = storage?.get(S.REPEAT);

  // TODO: temporary buffer to update sessions with old numeric repeat type REMOVE SOON
  if (typeof repeatNumber === 'number') {
    let repeat = BaseVersion.RepeatType.ALL;
    if (repeatNumber === 0) repeat = BaseVersion.RepeatType.OFF;
    else if (repeatNumber < 100) repeat = BaseVersion.RepeatType.DIALOG;
    storage.set(S.REPEAT, repeat);
  }
  turn.set(T.REQUEST, runtime.getRequest());
  variables.set(V.TIMESTAMP, Math.floor(Date.now() / 1000));

  await runtime.update();
};

export default update;
