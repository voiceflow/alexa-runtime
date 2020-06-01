import { HandlerFactory } from '@voiceflow/client';

import { S, T } from '@/lib/constants';

import { IntentRequest, Mapping, RequestType } from '../types';
import { addRepromptIfExists, formatName, mapSlots } from '../utils';
import CommandHandler from './command';
import NoMatchHandler from './noMatch';

type Choice = {
  intent: string;
  mappings?: Mapping[];
  nextIdIndex?: number;
};

type Interaction = {
  elseId?: string;
  noMatches?: string[];
  nextIds: string[];
  reprompt?: string;
  interactions: Choice[];
  randomize?: boolean;
};

const utilsObj = {
  addRepromptIfExists,
  formatName,
  mapSlots,
  commandHandler: CommandHandler(),
  noMatchHandler: NoMatchHandler(),
};

export const InteractionHandler: HandlerFactory<Interaction, typeof utilsObj> = (utils) => ({
  canHandle: (block) => {
    return !!block.interactions;
  },
  handle: (block, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;

    if (request?.type !== RequestType.INTENT) {
      utils.addRepromptIfExists(block, context, variables);
      context.trace.choice(block.interactions.map(({ intent }) => ({ name: intent })));

      // clean up no matches counter on new interaction
      context.storage.delete(S.NO_MATCHES_COUNTER);

      // quit cycleStack without ending session by stopping on itself
      return block.blockID;
    }

    let nextId: string | null = null;
    let variableMap: Mapping[] | null = null;

    const { intent } = request.payload;

    // check if there is a choice in the block that fulfills intent
    block.interactions.forEach((choice, i: number) => {
      if (choice.intent && utils.formatName(choice.intent) === intent.name) {
        variableMap = choice.mappings ?? null;
        nextId = block.nextIds[choice.nextIdIndex || choice.nextIdIndex === 0 ? choice.nextIdIndex : i];

        context.trace.debug(`matched choice **${choice.intent}** - taking path ${i + 1}`);
      }
    });

    if (variableMap && intent.slots) {
      // map request mappings to variables
      variables.merge(utils.mapSlots(variableMap, intent.slots));
    }

    // check if there is a command in the stack that fulfills intent
    if (!nextId && utils.commandHandler.canHandle(context)) {
      return utils.commandHandler.handle(context, variables);
    }

    // request for this turn has been processed, delete request
    context.turn.delete(T.REQUEST);

    // check for noMatches to handle
    if (!nextId && utils.noMatchHandler.canHandle(block, context)) {
      return utils.noMatchHandler.handle(block, context, variables);
    }

    // clean up no matches counter
    context.storage.delete(S.NO_MATCHES_COUNTER);

    return (nextId || block.elseId) ?? null;
  },
});

export default () => InteractionHandler(utilsObj);
