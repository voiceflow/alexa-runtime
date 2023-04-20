import { BaseNode, Nullable } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import { isPromptContentInitialyzed } from '@voiceflow/general-runtime/build/lib/services/runtime/utils';
import { Runtime, Store } from '@voiceflow/general-runtime/build/runtime';
import { VoiceNode } from '@voiceflow/voice-types';
import { VoiceflowConstants } from '@voiceflow/voiceflow-types';
import _ from 'lodash';

import { S } from '@/lib/constants';
import { addOutput } from '@/lib/services/runtime/handlers/utils/output';

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

  if (!exhaustedReprompts) {
    const speak = (node.noMatch?.randomize ? _.sample(noMatchPrompts) : noMatchPrompts?.[noMatchCounter]) || '';
    return replaceVariables(speak, sanitizedVars);
  }

  // if we have exhausted reprompts AND there is a following action,
  // we should not continue prompting
  if (node.noMatch?.nodeID) {
    return null;
  }

  if (!isPromptContentInitialyzed(globalNoMatchPrompt?.content)) {
    return VoiceflowConstants.defaultMessages.globalNoMatch;
  }

  return replaceVariables(globalNoMatchPrompt?.content, sanitizedVars);
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

    addOutput(output, runtime);

    runtime.storage.set(S.NO_MATCHES_COUNTER, noMatchCounter + 1);
    addRepromptIfExists({ node: _node, runtime, variables });

    return node.id;
  },
});

const createNoMatchHandler = () => NoMatchHandler();

export default createNoMatchHandler;
