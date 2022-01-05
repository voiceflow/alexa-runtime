import { Node } from '@voiceflow/alexa-types';
import { NodeType } from '@voiceflow/base-types/build/common/node';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { Intent } from 'ask-sdk-model';
import _ from 'lodash';

import { T } from '@/lib/constants';

import { IntentRequest, RequestType } from '../types';
import { addRepromptIfExists, mapSlots } from '../utils';
import CommandHandler from './command';
import NoMatchHandler from './noMatch';
import RepeatHandler from './repeat';
import { TurnElicitSlot } from './responseBuilders';
import { createDelegateIntent, createElicitSlot } from './utils/directives';

const utilsObj = {
  addRepromptIfExists,
  noMatchHandler: NoMatchHandler(),
  commandHandler: CommandHandler(),
  repeatHandler: RepeatHandler(),
};

export const CaptureV2Handler: HandlerFactory<Node.CaptureV2.Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => node.type === NodeType.CAPTURE_V2,
  handle: (node, runtime, variables) => {
    const request = runtime.turn.get<IntentRequest>(T.REQUEST);

    if (request?.type !== RequestType.INTENT) {
      utils.addRepromptIfExists({ node, runtime, variables });

      if (node.intent?.entities) {
        runtime.turn.set<TurnElicitSlot>(T.ELICIT_SLOT, createElicitSlot(node.intent.name, node.intent.entities));
      }
      // quit cycleStack without ending session by stopping on itself
      return node.id;
    }

    // check if there is a command in the stack that fulfills intent
    if (utils.commandHandler.canHandle(runtime)) {
      return utils.commandHandler.handle(runtime, variables);
    }

    if (utils.repeatHandler.canHandle(runtime)) {
      return utils.repeatHandler.handle(runtime);
    }

    const { intent } = request.payload;

    if (intent.name === node.intent?.name) {
      const firstEntity = intent.slots?.[node.intent.entities?.[0]!];
      if (node.variable && firstEntity) {
        variables.set(node.variable, firstEntity.value);
      } else if (node.intent.entities && intent.slots) {
        variables.merge(mapSlots({ slots: intent.slots, mappings: node.intent.entities.map((slot) => ({ slot, variable: slot })) }));
      }
      // request for this turn has been processed, delete request
      runtime.turn.delete(T.REQUEST);
      return node.nextId ?? null;
    }

    // handle noMatch
    const noMatchPath = utils.noMatchHandler.handle(node, runtime, variables);
    if (noMatchPath === node.id && node.intent?.entities) {
      runtime.turn.set<Intent>(T.DELEGATE, createDelegateIntent(node.intent.name, node.intent.entities));
    }

    return noMatchPath;
  },
});

export default () => CaptureV2Handler(utilsObj);
