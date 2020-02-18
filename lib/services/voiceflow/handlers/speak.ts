import { Handler } from '@voiceflow/client';
import _ from 'lodash';

import { F, S } from '@/lib/constants';

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
    return !!block.random_speak || !!block.audio || (_.isString(block.prompt) && block.prompt !== 'true') || !!block.speak;
  },
  handle: (block, context, variables) => {
    let { speak } = block;

    // Pick a random part to speak
    if (Array.isArray(block.random_speak)) {
      speak = _.sample(block.random_speak);
    }

    // turn float variables to 2 decimal places
    const sanitizedVars = Object.entries(variables.getState()).reduce<Record<string, any>>((acc, [key, value]) => {
      if (_.isNumber(value) && !Number.isInteger(value)) {
        acc[key] = value.toFixed(2);
      } else {
        acc[key] = value;
      }

      return acc;
    }, {});

    if (_.isString(speak)) {
      const output = regexVariables(speak, sanitizedVars);

      context.storage.produce((draft) => {
        draft[S.OUTPUT] += output;
      });

      context.stack.top().storage.set(F.SPEAK, output);
    }

    return block.nextId ?? null;
  },
};

export default SpeakHandler;
