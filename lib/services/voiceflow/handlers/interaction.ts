import { T } from '@/lib/constants';

import { Choice, Handler, IntentRequest, Mapping, RequestType } from '../types';
import { addRepromptIfExists, findAlexaCommand, formatName, mapSlots } from '../utils';

const InteractionHandler: Handler = {
  canHandle: (block) => {
    return !!block.interactions;
  },
  handle: (block, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;

    if (request?.type !== RequestType.INTENT) {
      addRepromptIfExists(block, context, variables);
      // quit cycleStack without ending session
      context.end();
      return block.id;
    }

    let nextId: string;
    let variableMap: Mapping[];

    const { intent } = request.payload;

    // check if there is a choice in the block that fulfills intent
    block.interactions.forEach((choice: Choice, i: number) => {
      if (choice.intent && formatName(choice.intent) === intent.name) {
        variableMap = choice.mappings;
        nextId = block.nextIds[choice.nextIdIndex || choice.nextIdIndex === 0 ? choice.nextIdIndex : i];
      }
    });

    // check if there is a command in the stack that fulfills intent.
    if (nextId === undefined) {
      const commandData = findAlexaCommand(intent.name, context);
      if (commandData) {
        ({ nextId, variableMap } = commandData);
      }
    }

    if (variableMap) {
      // map request mappings to variables
      variables.merge(mapSlots(variableMap, intent.slots));
    }

    // request for this turn has been processed, delete request
    context.turn.set(T.REQUEST, null);

    return nextId || block.elseId;
  },
};

export default InteractionHandler;
