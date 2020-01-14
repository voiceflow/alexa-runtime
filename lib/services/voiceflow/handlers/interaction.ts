import { Handler } from '@voiceflow/client';

import Logger from '@/logger';

// TODO: this whole file is horrible just want to make things work as a first step

const formatName = (name) => {
  if (!name) {
    return name;
  }
  let formatted_name = '';
  try {
    formatted_name = name.replace(/ /g, '_');
    // eslint-disable-next-line no-empty
  } catch (err) {
    Logger.log(err);
  }

  Array.from(Array(10).keys()).forEach((i) => {
    const replace = i.toString();
    const re = new RegExp(replace, 'g');
    formatted_name = formatted_name.replace(re, String.fromCharCode(i + 65));
  });
  return formatted_name;
};

const stringToNumIfNumeric = (str) => {
  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(str)) {
    str = +str;
  }
  return str;
};

const mapVariables = (context, variables, overwrite = false) => {
  const { turn } = context;
  if (turn.get('mappings') && turn.get('slots')) {
    turn.get('mappings').forEach((map) => {
      if (!map.slot) {
        return;
      }
      const toVariable = map.variable;
      const fromSlot = map.slot ? formatName(map.slot) : null;

      let fromSlotValue;
      try {
        fromSlotValue =
          turn.get('slots')[fromSlot].resolutions.resolutionsPerAuthority[0].values &&
          turn.get('slots')[fromSlot].resolutions.resolutionsPerAuthority[0].values[0].value.name;
      } catch (e) {
        // Resolution does not exist
      }

      if (!fromSlotValue) {
        fromSlotValue = turn.get('slots')[fromSlot] ? turn.get('slots')[fromSlot].value : null;
      }

      if (toVariable && (fromSlotValue || overwrite)) {
        variables.set(toVariable, stringToNumIfNumeric(fromSlotValue));
      }
    });
  }
  turn.delete('mappings');
};

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

const addRepromptIfExists = (block, context, variables) => {
  if (block.reprompt) {
    context.turn.set('reprompt', RegexVariables(block.reprompt, variables));
  }
};

const InteractionHandler: Handler = {
  canHandle: (block) => {
    return !!block.interactions;
  },
  handle: (block, context, variables) => {
    const { turn } = context;

    if (!turn.get('intent')) {
      addRepromptIfExists(block, context, variables);
      context.end();
      return block.id;
    }

    let nextId;

    block.interactions.forEach((choice, i) => {
      if (choice.intent && formatName(choice.intent) === turn.get('intent')) {
        context.turn.set('mappings', choice.mappings);
        nextId = block.nextIds[choice.nextIdIndex || choice.nextIdIndex === 0 ? choice.nextIdIndex : i];
      }
    });
    if (nextId === undefined) {
      // const commandId = findCommand(state, diagram, state.transformed_input);

      // if (state.enteringNewDiagram) {
      //   nextId = null;
      // } else {
      //   nextId = commandId || block.elseId;
      // }
      nextId = block.elseId;
    }
    mapVariables(context, variables, block.overwrite);
    turn.delete('intent');
    return nextId;
  },
};

export default InteractionHandler;
