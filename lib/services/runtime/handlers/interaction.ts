import { Node } from '@voiceflow/alexa-types';
import { SlotMapping } from '@voiceflow/api-sdk';
import { formatIntentName } from '@voiceflow/common';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';

import { S, T } from '@/lib/constants';

import { IntentRequest, RequestType } from '../types';
import { addRepromptIfExists, mapSlots } from '../utils';
import CommandHandler from './command';
import NoMatchHandler from './noMatch';
import RepeatHandler from './repeat';

const utilsObj = {
  mapSlots,
  repeatHandler: RepeatHandler(),
  commandHandler: CommandHandler(),
  noMatchHandler: NoMatchHandler(),
  formatIntentName,
  addRepromptIfExists,
};

export const InteractionHandler: HandlerFactory<Node.Interaction.Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.interactions,
  // eslint-disable-next-line sonarjs/cognitive-complexity
  handle: (node, runtime, variables) => {
    const request = runtime.turn.get<IntentRequest>(T.REQUEST);

    if (request?.type !== RequestType.INTENT) {
      utils.addRepromptIfExists({ node, runtime, variables });

      // clean up no matches counter on new interaction
      runtime.storage.delete(S.NO_MATCHES_COUNTER);

      // quit cycleStack without ending session by stopping on itself
      return node.id;
    }

    let nextId: string | null | undefined;
    let variableMap: SlotMapping[] | null = null;

    const { intent } = request.payload;

    // check if there is a choice in the node that fulfills intent
    node.interactions.forEach((choice, i: number) => {
      if (choice.intent && utils.formatIntentName(choice.intent) === intent.name) {
        if (choice.goTo) {
          runtime.turn.set(T.GOTO, choice.goTo.intentName);
          // stop on itself to await for new intent request coming in
          nextId = node.id;
        } else {
          variableMap = choice.mappings ?? null;
          nextId = node.nextIds[choice.nextIdIndex || choice.nextIdIndex === 0 ? choice.nextIdIndex : i];
        }
      }
    });

    if (variableMap && intent.slots) {
      // map request mappings to variables
      variables.merge(utils.mapSlots({ slots: intent.slots, mappings: variableMap }));
    }

    // check if there is a command in the stack that fulfills intent
    if (nextId === undefined) {
      if (utils.commandHandler.canHandle(runtime)) {
        return utils.commandHandler.handle(runtime, variables);
      }
      if (utils.repeatHandler.canHandle(runtime)) {
        return utils.repeatHandler.handle(runtime);
      }
    }

    // request for this turn has been processed, delete request
    runtime.turn.delete(T.REQUEST);

    // check for noMatches to handle
    if (nextId === undefined && utils.noMatchHandler.canHandle(node, runtime)) {
      return utils.noMatchHandler.handle(node, runtime, variables);
    }

    // clean up no matches counter
    runtime.storage.delete(S.NO_MATCHES_COUNTER);

    return (nextId !== undefined ? nextId : node.elseId) || null;
  },
});

export default () => InteractionHandler(utilsObj);
