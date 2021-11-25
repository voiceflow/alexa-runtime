import { Node as BaseNode, Nullable } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import { Runtime, Store } from '@voiceflow/general-runtime/build/runtime';
import { Node as VoiceNode } from '@voiceflow/voice-types';
import _ from 'lodash';

import { S } from '@/lib/constants';

export type NoMatchCounterStorage = number;

export const EMPTY_AUDIO_STRING = '<audio src=""/>';

type NoMatchNode = BaseNode.Utils.BaseNode & { noMatch?: Nullable<VoiceNode.Utils.NodeNoMatch> };
type DeprecatedNoMatchNode = NoMatchNode & VoiceNode.Utils.DeprecatedNodeNoMatch;

const convertDeprecatedNoMatch = ({ noMatch, elseId, noMatches, randomize, ...node }: DeprecatedNoMatchNode): NoMatchNode =>
  ({
    noMatch: {
      prompts: noMatch?.prompts ?? noMatches,
      randomize: noMatch?.randomize ?? randomize,
      nodeID: noMatch?.nodeID ?? elseId,
    },
    ...node,
  } as NoMatchNode);

const removeEmptyNoMatches = (node: NoMatchNode) => {
  const noMatches = node.noMatch?.prompts || [];
  return noMatches?.filter((noMatch) => noMatch != null && noMatch !== EMPTY_AUDIO_STRING);
};

export const NoMatchHandler = () => ({
  handle: (_node: DeprecatedNoMatchNode, runtime: Runtime, variables: Store) => {
    const node = convertDeprecatedNoMatch(_node);
    const nonEmptyNoMatches = removeEmptyNoMatches(node);

    const noMatchCounter = runtime.storage.get<NoMatchCounterStorage>(S.NO_MATCHES_COUNTER) ?? 0;
    if (noMatchCounter >= nonEmptyNoMatches.length) {
      // clean up no matches counter
      runtime.storage.delete(S.NO_MATCHES_COUNTER);
      return node.noMatch?.nodeID ?? null;
    }

    runtime.storage.set(S.NO_MATCHES_COUNTER, noMatchCounter + 1);

    const speak =
      (node.noMatch?.randomize
        ? _.sample(nonEmptyNoMatches)
        : nonEmptyNoMatches?.[runtime.storage.get<NoMatchCounterStorage>(S.NO_MATCHES_COUNTER)! - 1]) || '';
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
