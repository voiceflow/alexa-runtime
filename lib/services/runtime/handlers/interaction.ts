import { Node } from '@voiceflow/alexa-types';
import { formatIntentName } from '@voiceflow/common';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { Intent } from 'ask-sdk-model';

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
  handle: (node, runtime, variables) => {
    const request = runtime.turn.get<IntentRequest>(T.REQUEST);

    if (request?.type !== RequestType.INTENT) {
      utils.addRepromptIfExists({ node, runtime, variables });

      // clean up no matches counter on new interaction
      runtime.storage.delete(S.NO_MATCHES_COUNTER);

      // quit cycleStack without ending session by stopping on itself
      return node.id;
    }

    // request for this turn has been processed, delete request
    const { intent } = request.payload;

    const index = node.interactions.findIndex((choice) => choice.intent && utils.formatIntentName(choice.intent) === intent.name);
    const choice = node.interactions[index];
    if (choice) {
      if (choice.goTo?.intentName) {
        runtime.turn.set<Intent>(T.DELEGATE, { name: choice.goTo.intentName, slots: {}, confirmationStatus: 'NONE' });
        return node.id;
      }
      if (choice.mappings && intent.slots) {
        variables.merge(utils.mapSlots({ slots: intent.slots, mappings: choice.mappings }));
      }
      return node.nextIds[choice.nextIdIndex ?? index] ?? null;
    }

    // check if there is a command in the stack that fulfills intent
    if (utils.commandHandler.canHandle(runtime)) {
      return utils.commandHandler.handle(runtime, variables);
    }
    if (utils.repeatHandler.canHandle(runtime)) {
      return utils.repeatHandler.handle(runtime);
    }

    // request for this turn has been processed, delete request
    runtime.turn.delete(T.REQUEST);

    // handle noMatch
    return utils.noMatchHandler.handle(node, runtime, variables);
  },
});

export default () => InteractionHandler(utilsObj);
