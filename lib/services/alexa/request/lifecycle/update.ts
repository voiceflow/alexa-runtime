import { RepeatType } from '@voiceflow/general-types';
import { Context } from '@voiceflow/runtime';

import { S, T, V } from '@/lib/constants';

const update = async (context: Context): Promise<void> => {
  const { turn, variables, storage } = context;

  const repeatNumber = storage?.get(S.REPEAT);

  // TODO: temporary buffer to update sessions with old numeric repeat type REMOVE SOON
  if (typeof repeatNumber === 'number') {
    let repeat = RepeatType.ALL;
    if (repeatNumber === 0) repeat = RepeatType.OFF;
    else if (repeatNumber < 100) repeat = RepeatType.DIALOG;
    storage.set(S.REPEAT, repeat);
  }

  turn.set(T.REQUEST, context.getRequest());
  variables.set(V.TIMESTAMP, Math.floor(Date.now() / 1000));

  await context.update();
};

export default update;
