import { Node } from '@voiceflow/api-sdk';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import { TraceType } from '@voiceflow/general-types';
import { SpeakType, TraceFrame } from '@voiceflow/general-types/build/nodes/speak';
import { Runtime, Store } from '@voiceflow/runtime';
import _ from 'lodash';

import { S } from '@/lib/constants';

export type NoMatchCounterStorage = number;

type NoMatchNode = Node<any, { noMatches?: string[]; randomize?: boolean }>;

export const EMPTY_AUDIO_STRING = '<audio src=""/>';

const removeEmptyNoMatches = (noMatchArray?: string[]) => noMatchArray?.filter((noMatch) => noMatch != null && noMatch !== EMPTY_AUDIO_STRING);

export const NoMatchHandler = () => ({
  canHandle: (node: NoMatchNode, runtime: Runtime) => {
    const nonEmptyNoMatches = removeEmptyNoMatches(node.noMatches);

    return Array.isArray(nonEmptyNoMatches) && nonEmptyNoMatches.length > (runtime.storage.get<NoMatchCounterStorage>(S.NO_MATCHES_COUNTER) ?? 0);
  },
  handle: (node: NoMatchNode, runtime: Runtime, variables: Store) => {
    runtime.storage.produce<{ [S.NO_MATCHES_COUNTER]: NoMatchCounterStorage }>((draft) => {
      draft[S.NO_MATCHES_COUNTER] = draft[S.NO_MATCHES_COUNTER] ? draft[S.NO_MATCHES_COUNTER] + 1 : 1;
    });

    const nonEmptyNoMatches = removeEmptyNoMatches(node.noMatches);
    const speak =
      (node.randomize ? _.sample(nonEmptyNoMatches) : nonEmptyNoMatches?.[runtime.storage.get<NoMatchCounterStorage>(S.NO_MATCHES_COUNTER)! - 1]) ||
      '';
    const sanitizedVars = sanitizeVariables(variables.getState());
    const output = replaceVariables(speak, sanitizedVars);

    runtime.storage.produce((draft) => {
      draft[S.OUTPUT] += output;
    });

    runtime.trace.addTrace<TraceFrame>({
      type: TraceType.SPEAK,
      payload: { message: output, type: SpeakType.MESSAGE },
    });

    return node.id;
  },
});

export default () => NoMatchHandler();
