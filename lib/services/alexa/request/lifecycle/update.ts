import { RepeatType } from '@voiceflow/alexa-types';
import { Context } from '@voiceflow/client';

import { S, T, V } from '@/lib/constants';

const update = async (context: Context): Promise<void> => {
  const { turn, variables, storage } = context;

  // TODO: temporary buffer to update sessions with old numeric repeat type REMOVE SOON
  if (typeof storage?.get(S.REPEAT) === 'number') {
    let repeat = RepeatType.ALL;
    if (storage.get(S.REPEAT) === 0) repeat = RepeatType.OFF;
    else if (storage.get(S.REPEAT) < 100) repeat = RepeatType.DIALOG;
    storage.set(S.REPEAT, repeat);
  }

  turn.set(T.REQUEST, context.getRequest());
  variables.set(V.TIMESTAMP, Math.floor(Date.now() / 1000));

  await context.update();
};

export default update;
