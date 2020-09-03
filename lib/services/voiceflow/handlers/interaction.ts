import { Node as InteractionNode } from '@voiceflow/alexa-types/build/nodes/interaction';
import { HandlerFactory } from '@voiceflow/client';

import { S, T } from '@/lib/constants';

import { IntentRequest, Mapping, RequestType } from '../types';
import { addRepromptIfExists, formatName, mapSlots } from '../utils';
import CommandHandler from './command';
import NoMatchHandler from './noMatch';
import RepeatHandler from './repeat';

const utilsObj = {
  addRepromptIfExists,
  formatName,
  mapSlots,
  commandHandler: CommandHandler(),
  repeatHandler: RepeatHandler(),
  noMatchHandler: NoMatchHandler(),
};

export const InteractionHandler: HandlerFactory<InteractionNode, typeof utilsObj> = (utils) => ({
  canHandle: (node) => {
    return !!node.interactions;
  },
  handle: (node, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;

    if (request?.type !== RequestType.INTENT) {
      utils.addRepromptIfExists(node, context, variables);
      context.trace.choice(node.interactions.map(({ intent }) => ({ name: intent })));

      // clean up no matches counter on new interaction
      context.storage.delete(S.NO_MATCHES_COUNTER);

      // quit cycleStack without ending session by stopping on itself
      return node.id;
    }

    let nextId: string | null = null;
    let variableMap: Mapping[] | null = null;

    const { intent } = request.payload;

    // check if there is a choice in the node that fulfills intent
    node.interactions.forEach((choice, i: number) => {
      if (choice.intent && utils.formatName(choice.intent) === intent.name) {
        variableMap = (choice.mappings as Mapping[]) ?? null;
        nextId = node.nextIds[choice.nextIdIndex || choice.nextIdIndex === 0 ? choice.nextIdIndex : i];

        context.trace.debug(`matched choice **${choice.intent}** - taking path ${i + 1}`);
      }
    });

    if (variableMap && intent.slots) {
      // map request mappings to variables
      variables.merge(utils.mapSlots(variableMap, intent.slots));
    }

    // check if there is a command in the stack that fulfills intent
    if (!nextId) {
      if (utils.commandHandler.canHandle(context)) {
        return utils.commandHandler.handle(context, variables);
      }
      if (utils.repeatHandler.canHandle(context)) {
        return utils.repeatHandler.handle(context);
      }
    }

    // request for this turn has been processed, delete request
    context.turn.delete(T.REQUEST);

    // check for noMatches to handle
    if (!nextId && utils.noMatchHandler.canHandle(node, context)) {
      return utils.noMatchHandler.handle(node, context, variables);
    }

    // clean up no matches counter
    context.storage.delete(S.NO_MATCHES_COUNTER);

    return (nextId || node.elseId) ?? null;
  },
});

export default () => InteractionHandler(utilsObj);
