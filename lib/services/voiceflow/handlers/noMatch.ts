import { Node } from '@voiceflow/api-sdk';
import { Context, Store } from '@voiceflow/client';
import _ from 'lodash';

import { S } from '@/lib/constants';

import { regexVariables, sanitizeVariables } from '../utils';

type NoMatchNode = Node<
  any,
  {
    noMatches?: string[];
    randomize?: boolean;
  }
>;

const EMPTY_AUDIO_STRING = '<audio src=""/>';

const removeEmptyNoMatches = (noMatchArray?: string[]) => {
  return noMatchArray?.filter((noMatch) => {
    return noMatch != null && noMatch !== EMPTY_AUDIO_STRING;
  });
};

export const NoMatchHandler = () => ({
  canHandle: (node: NoMatchNode, context: Context) => {
    const nonEmptyNoMatches = removeEmptyNoMatches(node.noMatches);
    return Array.isArray(nonEmptyNoMatches) && nonEmptyNoMatches.length > (context.storage.get(S.NO_MATCHES_COUNTER) ?? 0);
  },
  handle: (node: NoMatchNode, context: Context, variables: Store) => {
    context.storage.produce((draft) => {
      draft[S.NO_MATCHES_COUNTER] = draft[S.NO_MATCHES_COUNTER] ? draft[S.NO_MATCHES_COUNTER] + 1 : 1;
    });

    const nonEmptyNoMatches = removeEmptyNoMatches(node.noMatches);

    const speak = (node.randomize ? _.sample(nonEmptyNoMatches) : nonEmptyNoMatches?.[context.storage.get(S.NO_MATCHES_COUNTER) - 1]) || '';

    const sanitizedVars = sanitizeVariables(variables.getState());
    // replaces var values
    const output = regexVariables(speak, sanitizedVars);

    context.storage.produce((draft) => {
      draft[S.OUTPUT] += output;
    });
    context.trace.speak(output);

    return node.id;
  },
});

export default () => NoMatchHandler();
