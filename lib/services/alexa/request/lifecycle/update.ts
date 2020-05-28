import { Context } from '@voiceflow/client';

import { T, V } from '@/lib/constants';

const update = async (context: Context): Promise<void> => {
  const { turn, variables } = context;

  turn.set(T.REQUEST, context.getRequest());
  variables.set(V.TIMESTAMP, Math.floor(Date.now() / 1000));

  await context.update();
};

export default update;
