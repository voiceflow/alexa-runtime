import { Handler } from '@voiceflow/client';
import _ from 'lodash';

import { regexVariables } from '../utils';

export type Speak = {
  audio?: string;
  speak?: string;
  prompt?: string;
  nextId?: string;
  random_speak?: string[];
};

const SpeakHandler: Handler<Speak> = {
  canHandle: (block) => {
    return !!block.random_speak || !!block.audio || (typeof block.prompt === 'string' && block.prompt !== 'true') || !!block.speak;
  },
  handle: (block, context, variables) => {
    let { speak } = block;

    // Pick a random part to speak
    if (Array.isArray(block.random_speak)) {
      speak = _.sample(block.random_speak);
    }

    // turn float variables to 2 decimal places
    const sanitizedVars = Object.entries(variables.getState()).reduce<Record<string, any>>((acc, [key, value]) => {
      if (typeof value === 'number' && !Number.isInteger(value)) {
        acc[key] = value.toFixed(2);
      } else {
        acc[key] = value;
      }

      return acc;
    }, {});

    if (typeof speak === 'string') {
      const output = regexVariables(speak, sanitizedVars);

      context.storage.produce((draft) => {
        draft.output += output;
      });
    }

    return block.nextId ?? null;
  },
};

export default SpeakHandler;
