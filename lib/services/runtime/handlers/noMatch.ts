import { Node as BaseNode } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import { Runtime, Store } from '@voiceflow/general-runtime/build/runtime';
import { Node as VoiceNode } from '@voiceflow/voice-types';
import _ from 'lodash';

import { S } from '@/lib/constants';

export type NoMatchCounterStorage = number;

export const EMPTY_AUDIO_STRING = '<audio src=""/>';

const removeEmptyNoMatches = (noMatchArray?: string[]) => noMatchArray?.filter((noMatch) => noMatch != null && noMatch !== EMPTY_AUDIO_STRING);

export const NoMatchHandler = () => ({
  canHandle: (node: VoiceNode.Utils.NodeNoMatch & BaseNode.Utils.BaseNode, runtime: Runtime) => {
    const nonEmptyNoMatches = removeEmptyNoMatches(node.noMatches);

    return Array.isArray(nonEmptyNoMatches) && nonEmptyNoMatches.length > (runtime.storage.get<NoMatchCounterStorage>(S.NO_MATCHES_COUNTER) ?? 0);
  },
  handle: (node: VoiceNode.Utils.NodeNoMatch & BaseNode.Utils.BaseNode, runtime: Runtime, variables: Store) => {
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

    runtime.trace.addTrace<BaseNode.Speak.TraceFrame>({
      type: BaseNode.Utils.TraceType.SPEAK,
      payload: { message: output, type: BaseNode.Speak.TraceSpeakType.MESSAGE },
    });

    return node.id;
  },
});

export default () => NoMatchHandler();
