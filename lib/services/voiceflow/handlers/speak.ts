import { NodeType } from '@voiceflow/alexa-types';
import { Node } from '@voiceflow/api-sdk';
import { HandlerFactory } from '@voiceflow/client';
import _ from 'lodash';

import { F, S } from '@/lib/constants';

import { regexVariables, sanitizeVariables } from '../utils';

export type SpeakNode = Node<
  NodeType.SPEAK,
  {
    audio?: string;
    speak?: string;
    prompt?: string;
    nextId?: string;
    random_speak?: string[];
  }
>;

const SpeakHandler: HandlerFactory<SpeakNode> = () => ({
  canHandle: (node) => {
    return !!node.random_speak || !!node.audio || (_.isString(node.prompt) && node.prompt !== 'true') || !!node.speak;
  },
  handle: (node, context, variables) => {
    let { speak } = node;

    // Pick a random part to speak
    if (Array.isArray(node.random_speak)) {
      speak = _.sample(node.random_speak);
    }

    const sanitizedVars = sanitizeVariables(variables.getState());

    if (_.isString(speak)) {
      const output = regexVariables(speak, sanitizedVars);

      context.storage.produce((draft) => {
        draft[S.OUTPUT] += output;
      });

      context.stack.top().storage.set(F.SPEAK, output);
      context.trace.speak(output);
    }

    return node.nextId ?? null;
  },
});

export default SpeakHandler;
