import { Context, Store } from '@voiceflow/client';

import { S } from '@/lib/constants';

import { regexVariables, sanitizeVariables } from '../utils';

type Block = {
  blockID: string;
  noMatches?: string[];
};

export const NoMatchHandler = () => ({
  canHandle: (block: Block, context: Context) => {
    return (block.noMatches?.length ?? 0) > (context.storage.get(S.NO_MATCHES_COUNTER) ?? 0);
  },
  handle: (block: Block, context: Context, variables: Store) => {
    context.storage.produce((draft) => {
      draft[S.NO_MATCHES_COUNTER] = draft[S.NO_MATCHES_COUNTER] ? draft[S.NO_MATCHES_COUNTER] + 1 : 1;
    });

    const speak = block.noMatches?.[context.storage.get(S.NO_MATCHES_COUNTER) - 1] || '';

    const sanitizedVars = sanitizeVariables(variables.getState());
    // replaces var values
    const output = regexVariables(speak, sanitizedVars);

    context.storage.produce((draft) => {
      draft[S.OUTPUT] += output;
    });
    context.trace.speak(output);

    return block.blockID;
  },
});

export default () => NoMatchHandler();
