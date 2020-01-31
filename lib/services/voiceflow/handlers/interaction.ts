import { Context, Handler, Mapping } from '@voiceflow/client';

import { T } from '@/lib/constants';

import { IntentRequest, RequestType } from '../types';
import { addRepromptIfExists, formatName, mapSlots } from '../utils';
import CommandHandler from './command';

type Choice = {
  intent: string;
  mappings?: Mapping[];
  nextIdIndex?: number;
};

export type Interaction = {
  id: string;
  elseId?: string;
  nextIds: string[];
  reprompt?: string;
  interactions: Choice[];
};

const InteractionHandler: Handler<Interaction> = {
  canHandle: (block) => {
    return !!block.interactions;
  },
  handle: (block, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;

    if (request?.type !== RequestType.INTENT) {
      addRepromptIfExists<Interaction>(block, context, variables);
      // quit cycleStack without ending session
      context.end();
      return block.id;
    }

    let nextId: string | null = null;
    let variableMap: Mapping[] | null = null;

    const { intent } = request.payload;

    // check if there is a choice in the block that fulfills intent
    block.interactions.forEach((choice, i: number) => {
      if (choice.intent && formatName(choice.intent) === intent.name) {
        variableMap = choice.mappings ?? null;
        nextId = block.nextIds[choice.nextIdIndex || choice.nextIdIndex === 0 ? choice.nextIdIndex : i];
      }
    });

    if (variableMap && intent.slots) {
      // map request mappings to variables
      variables.merge(mapSlots(variableMap, intent.slots));
    }

    if (!nextId) {
      // check if there is a command in the stack that fulfills intent
      nextId = CommandHandler.handle(context as Context<any>, variables);
    }

    // request for this turn has been processed, delete request
    context.turn.set(T.REQUEST, null);

    return (nextId || block.elseId) ?? null;
  },
};

export default InteractionHandler;
