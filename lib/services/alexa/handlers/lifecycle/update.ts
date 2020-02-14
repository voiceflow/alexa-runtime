import { Context } from '@voiceflow/client';

import { T } from '@/lib/constants';

const update = async (context: Context): Promise<void> => {
  const { turn } = context;

  turn.set(T.REQUEST, context.getRequest());

  await context.update();
};

export default update;
