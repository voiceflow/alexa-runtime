import { Context, Store } from '@voiceflow/client';
import _ from 'lodash';

import { S } from '@/lib/constants';

import { regexVariables, sanitizeVariables } from '../utils';

type Block = {
  blockID: string;
  noMatches?: string[];
  randomize?: boolean;
};

export const NoMatchHandler = () => ({
  canHandle: (block: Block, context: Context) => {
    return Array.isArray(block.noMatches) && block.noMatches.length > (context.storage.get(S.NO_MATCHES_COUNTER) ?? 0);
  },
  handle: (block: Block, context: Context, variables: Store) => {
    console.log('in no match handler');
    context.storage.produce((draft) => {
      draft[S.NO_MATCHES_COUNTER] = draft[S.NO_MATCHES_COUNTER] ? draft[S.NO_MATCHES_COUNTER] + 1 : 1;
    });

    const speak = (block.randomize ? _.sample(block.noMatches) : block.noMatches?.[context.storage.get(S.NO_MATCHES_COUNTER) - 1]) || '';

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
