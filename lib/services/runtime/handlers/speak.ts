import { AlexaNode } from '@voiceflow/alexa-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import _ from 'lodash';

import { addOutput } from '@/lib/services/runtime/handlers/utils/output';

// TODO: probably we can remove it, since prompt is not used in the node handler,
// and does not exist in the alexa/general service handler
const isPromptSpeak = (node: AlexaNode.Speak.Node & { prompt?: unknown }) =>
  _.isString(node.prompt) && node.prompt !== 'true';

const SpeakHandler: HandlerFactory<AlexaNode.Speak.Node> = () => ({
  canHandle: (node) => ('random_speak' in node ? !!node.random_speak : !!node.speak) || isPromptSpeak(node),

  handle: (node, runtime, variables) => {
    let speak = '';

    // Pick a random part to speak
    if ('random_speak' in node && Array.isArray(node.random_speak)) {
      speak = _.sample(node.random_speak) ?? '';
    } else if ('speak' in node) {
      ({ speak } = node);
    }

    const sanitizedVars = sanitizeVariables(variables.getState());

    if (_.isString(speak)) {
      const output = replaceVariables(speak, sanitizedVars);

      addOutput(output, runtime, { addToTop: true });
    }

    return node.nextId ?? null;
  },
});

export default SpeakHandler;
