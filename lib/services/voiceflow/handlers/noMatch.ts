import { Context, Store } from '@voiceflow/client';

import { S } from '@/lib/constants';

type Block = {
  blockID: string;
  noMatches?: string[];
};

export const NoMatchHandler = () => ({
  canHandle: (block: Block, context: Context) => {
    return (block.noMatches?.length ?? 0) > (context.storage.get(S.NO_MATCHES_COUNTER) ?? 0);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handle: (block: Block, context: Context, _variables: Store) => {
    context.storage.produce((draft) => {
      draft[S.NO_MATCHES_COUNTER] = draft[S.NO_MATCHES_COUNTER] ? draft[S.NO_MATCHES_COUNTER] + 1 : 1;
    });

    const output = block.noMatches?.[context.storage.get(S.NO_MATCHES_COUNTER) - 1] || '';
    context.storage.produce((draft) => {
      draft[S.OUTPUT] += output;
    });

    context.trace.speak(output);

    return block.blockID;
  },
});

export default () => NoMatchHandler();
