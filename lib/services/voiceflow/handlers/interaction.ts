import { Handler } from '@voiceflow/client';

import { T } from '@/lib/constants';

import { Choice, IntentRequest, Mapping, RequestType } from '../types';
import { addRepromptIfExists, formatName, mapSlots } from '../utils';

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

    block.interactions.forEach((choice: Choice, i: number) => {
      if (choice.intent && formatName(choice.intent) === intent.name) {
        variableMap = choice.mappings;
        nextId = block.nextIds[choice.nextIdIndex || choice.nextIdIndex === 0 ? choice.nextIdIndex : i];
      }
    });

    if (nextId === undefined) {
      // TODO: check if there is a command that fulfills intent. Otherwise nextId is elseId.
      nextId = block.elseId;
    }

    if (variableMap) {
      // map request mappings to variables
      variables.merge(mapSlots(variableMap, intent.slots));
    }

    // request for this turn has been processed, delete request
    context.turn.set(T.REQUEST, null);

    return nextId;
  },
};

export default InteractionHandler;
