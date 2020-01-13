import { Handler } from '@voiceflow/client';
import _ from 'lodash';

// TODO: this whole file is horrible just want to test if things are working
const replacer = (match, inner, variables, modifier) => {
  if (inner in variables) {
    return typeof modifier === 'function' ? modifier(variables[inner]) : variables[inner];
  }
  return match;
};

const RegexVariables = (phrase: string, variables: Record<string, any>, modifier?: Function) => {
  if (!phrase || !phrase.trim()) {
    return '';
  }
  return phrase.replace(/\{([a-zA-Z0-9_]{1,32})\}/g, (match, inner) => replacer(match, inner, variables, modifier));
};

const SpeakHandler: Handler = {
  canHandle: (block) => {
    return block.random_speak || block.audio || (typeof block.prompt === 'string' && block.prompt !== 'true') || block.speak;
  },
  handle: (block, context, variables) => {
    let { speak } = block;
    // Pick a random part to speak
    if (Array.isArray(block.random_speak)) {
      speak = _.sample(block.random_speak);
    }

    const temp = Object.entries(variables.getState()).reduce((acc, [key, value]) => {
      if (typeof value === 'number' && value % 1 !== 0) {
        acc[key] = value.toFixed(2);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});

    if (typeof speak === 'string') {
      const output = RegexVariables(speak, temp);

      context.storage.produce((draft) => {
        draft.output += output;
      });
    }

    return block.nextId;
  },
};

export default SpeakHandler;
