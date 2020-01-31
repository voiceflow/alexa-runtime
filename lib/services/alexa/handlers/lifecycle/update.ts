import { Context, DefaultBlock } from '@voiceflow/client';

import { S, T } from '@/lib/constants';
import { Block } from '@/lib/services/voiceflow';

const update = async (context: Context<Block | DefaultBlock>): Promise<void> => {
  const { turn, storage } = context;

  turn.set(T.REQUEST, context.getRequest());
  turn.set(T.PREVIOUS_OUTPUT, storage.get(S.OUTPUT));
  storage.set(S.OUTPUT, '');

  await context.update();
};

export default update;
