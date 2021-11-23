import { Node as BaseNode, Nullable } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import { Runtime, Store } from '@voiceflow/general-runtime/build/runtime';
import { Node as VoiceNode } from '@voiceflow/voice-types';
import _ from 'lodash';

import { S } from '@/lib/constants';

export type NoMatchCounterStorage = number;

export const EMPTY_AUDIO_STRING = '<audio src=""/>';

type NoMatchNode = BaseNode.Utils.BaseNode & VoiceNode.Utils.DeprecatedNodeNoMatch & { noMatch?: Nullable<VoiceNode.Utils.NodeNoMatch> };

const removeEmptyNoMatches = (node: NoMatchNode) => {
  const noMatches = node.noMatches || node.noMatch?.noMatches || [];
  return noMatches?.filter((noMatch) => noMatch != null && noMatch !== EMPTY_AUDIO_STRING);
};

const getElseID = (node: NoMatchNode) => node.elseId ?? node.noMatch?.nodeID ?? null;

export const NoMatchHandler = () => ({
  handle: (node: NoMatchNode, runtime: Runtime, variables: Store) => {
    const nonEmptyNoMatches = removeEmptyNoMatches(node);

    const noMatchCounter = runtime.storage.get<NoMatchCounterStorage>(S.NO_MATCHES_COUNTER) ?? 0;
    if (noMatchCounter >= nonEmptyNoMatches.length) {
      // clean up no matches counter
      runtime.storage.delete(S.NO_MATCHES_COUNTER);
      return getElseID(node);
    }

    runtime.storage.set(S.NO_MATCHES_COUNTER, noMatchCounter + 1);

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
