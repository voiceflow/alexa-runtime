import { HandlerFactory } from '@voiceflow/client';
import _ from 'lodash';

import { F, S } from '@/lib/constants';

import { regexVariables, sanitizeVariables } from '../utils';

export type Speak = {
  audio?: string;
  speak?: string;
  prompt?: string;
  nextId?: string;
  random_speak?: string[];
};

const SpeakHandler: HandlerFactory<Speak> = () => ({
  canHandle: (block) => {
    console.log('speak handler - canHandle', block);
    return !!block.random_speak || !!block.audio || (_.isString(block.prompt) && block.prompt !== 'true') || !!block.speak;
  },
  handle: (block, context, variables) => {
    console.log('speak handler - handle', block);

    let { speak } = block;

    // Pick a random part to speak
    if (Array.isArray(block.random_speak)) {
      speak = _.sample(block.random_speak);
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

    return block.nextId ?? null;
  },
});

export default SpeakHandler;
