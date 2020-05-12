import { HandlerFactory } from '@voiceflow/client';

import { F, S, T } from '@/lib/constants';

import { IntentRequest, Mapping, RequestType } from '../types';
import { addRepromptIfExists, formatName, mapSlots } from '../utils';
import CommandHandler from './command';

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
};

const utilsObj = {
  addRepromptIfExists,
  formatName,
  mapSlots,
  commandHandler: CommandHandler(),
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

    if (nextId) {
      // intent hit
      context.storage.delete(S.NO_MATCHES_COUNTER);
      return nextId;
    }

    // todo: wrap in new handler? (like commands)
    if (block.noMatches && block.noMatches?.length > (context.storage.get(S.NO_MATCHES_COUNTER) ?? 0)) {
      context.storage.produce((draft) => {
        draft[S.NO_MATCHES_COUNTER] = draft[S.NO_MATCHES_COUNTER] ?? 0;
        draft[S.NO_MATCHES_COUNTER]++;
      });

      // handle speak - todo: wrap in func and handle all speak cases
      const output = block.noMatches[context.storage.get(S.NO_MATCHES_COUNTER) - 1];
      context.storage.produce((draft) => {
        draft[S.OUTPUT] += output;
      });

      context.stack.top().storage.set(F.SPEAK, output);
      context.trace.speak(output);
      // end handle speak

      return block.blockID; // stay on interaction block
    }
    context.storage.delete(S.NO_MATCHES_COUNTER);

    return block.elseId ?? null;
  },
});

export default () => InteractionHandler(utilsObj);
