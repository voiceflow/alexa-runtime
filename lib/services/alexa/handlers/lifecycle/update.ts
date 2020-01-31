import { S, T } from '@/lib/constants';
import { Context } from '@/lib/services/voiceflow/types';

const update = async (context: Context): Promise<void> => {
  const { turn, storage } = context;
  turn.set(T.REQUEST, context.getRequest());
  turn.set(T.PREVIOUS_OUTPUT, storage.get(S.OUTPUT));
  storage.set(S.OUTPUT, '');

  await context.update();
};

export default update;
