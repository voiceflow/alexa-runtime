import { BaseNode, Nullable } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import { Runtime, Store } from '@voiceflow/general-runtime/build/runtime';
import { VoiceNode } from '@voiceflow/voice-types';
import _ from 'lodash';

import { S } from '@/lib/constants';

import { addRepromptIfExists, getGlobalNoMatchPrompt, RepromptNode } from '../utils';

export type NoMatchCounterStorage = number;

export const EMPTY_AUDIO_STRING = '<audio src=""/>';

interface NoMatchNode extends BaseNode.Utils.BaseNode {
  noMatch?: Nullable<VoiceNode.Utils.NodeNoMatch>;
}

interface DeprecatedNoMatchNode extends NoMatchNode, VoiceNode.Utils.DeprecatedNodeNoMatch {}

const convertDeprecatedNoMatch = ({
  noMatch,
  elseId,
  noMatches,
  randomize,
  ...node
}: DeprecatedNoMatchNode): NoMatchNode => {
  const mergedNoMatch: VoiceNode.Utils.NodeNoMatch = {
    prompts: noMatch?.prompts ?? noMatches,
    randomize: noMatch?.randomize ?? randomize,
    nodeID: noMatch?.nodeID ?? elseId,
  };

  return { noMatch: mergedNoMatch, ...node };
};

const removeEmptyPrompts = (node: NoMatchNode): string[] =>
  node.noMatch?.prompts?.filter((noMatch) => noMatch != null && noMatch !== EMPTY_AUDIO_STRING) ?? [];

const getOutput = (runtime: Runtime, node: NoMatchNode, noMatchCounter: number, variables: Store) => {
  const noMatchPrompts = removeEmptyPrompts(node);

  const exhaustedReprompts = noMatchCounter >= noMatchPrompts.length;
  const sanitizedVars = sanitizeVariables(variables.getState());
  const globalNoMatchPrompt = getGlobalNoMatchPrompt(runtime);

  if (exhaustedReprompts) {
    return replaceVariables(globalNoMatchPrompt?.content, sanitizedVars);
  }

  const speak = (node.noMatch?.randomize ? _.sample(noMatchPrompts) : noMatchPrompts?.[noMatchCounter]) || '';
  return replaceVariables(speak, sanitizedVars);
};

export const NoMatchHandler = () => ({
  handle: (_node: DeprecatedNoMatchNode & RepromptNode, runtime: Runtime, variables: Store) => {
    const node = convertDeprecatedNoMatch(_node);
    const noMatchCounter = runtime.storage.get<NoMatchCounterStorage>(S.NO_MATCHES_COUNTER) ?? 0;

    const output = getOutput(runtime, node, noMatchCounter, variables);

    if (!output) {
      // clean up no matches counter
      runtime.storage.delete(S.NO_MATCHES_COUNTER);
      return node.noMatch?.nodeID ?? null;
    }

    runtime.storage.produce((draft) => {
      draft[S.OUTPUT] += output;
    });

    runtime.trace.addTrace<BaseNode.Speak.TraceFrame>({
      type: BaseNode.Utils.TraceType.SPEAK,
      payload: { message: output, type: BaseNode.Speak.TraceSpeakType.MESSAGE },
    });

    if (node.noMatch?.nodeID) {
      runtime.storage.delete(S.NO_MATCHES_COUNTER);
      return node.noMatch.nodeID;
    }

    runtime.storage.set(S.NO_MATCHES_COUNTER, noMatchCounter + 1);
    addRepromptIfExists({ node: _node, runtime, variables });

    return node.id;
  },
});

const createNoMatchHandler = () => NoMatchHandler();

export default createNoMatchHandler;
