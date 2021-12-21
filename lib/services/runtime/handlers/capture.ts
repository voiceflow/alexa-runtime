import { Node } from '@voiceflow/alexa-types';
import { NodeType } from '@voiceflow/base-types/build/common/node';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { Intent } from 'ask-sdk-model';
import _ from 'lodash';
import wordsToNumbers from 'words-to-numbers';

import { T } from '@/lib/constants';

import { IntentRequest, RequestType } from '../types';
import { addRepromptIfExists, mapSlots } from '../utils';
import CommandHandler from './command';
import RepeatHandler from './repeat';
import { TurnElicitSlot } from './responseBuilders';

const getSlotValue = (intent: Intent) => {
  const intentSlots = intent.slots || {};
  const value = Object.keys(intentSlots).length === 1 && Object.values(intentSlots)[0]?.value;
  if (!value) return null;

  const num = wordsToNumbers(value);
  if (typeof num !== 'number' || Number.isNaN(num)) {
    return value;
  }
  return num;
};

const utilsObj = {
  mapSlots,
  getSlotValue,
  addRepromptIfExists,
  commandHandler: CommandHandler(),
  repeatHandler: RepeatHandler(),
};

export const CaptureHandler: HandlerFactory<Node.Capture.Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.variable || node.type === NodeType.CAPTURE,
  handle: (node, runtime, variables) => {
    const request = runtime.turn.get<IntentRequest>(T.REQUEST);

    if (request?.type !== RequestType.INTENT) {
      utils.addRepromptIfExists({ node, runtime, variables });

      if (node.intent && node.slots?.[0]) {
        runtime.turn.set<TurnElicitSlot>(T.ELICIT_SLOT, {
          slot: node.slots[0],
          intent: {
            name: node.intent,
            confirmationStatus: 'NONE',
            slots: node.slots.reduce(
              (acc, slotName) => ({
                ...acc,
                [slotName]: {
                  name: slotName,
                  value: '',
                  resolutions: {},
                  confirmationStatus: 'NONE',
                },
              }),
              {}
            ),
          },
        });
      }
      // quit cycleStack without ending session by stopping on itself
      return node.id;
    }

    let nextId: string | null = null;

    // check if there is a command in the stack that fulfills intent
    if (utils.commandHandler.canHandle(runtime)) {
      return utils.commandHandler.handle(runtime, variables);
    }

    if (utils.repeatHandler.canHandle(runtime)) {
      return utils.repeatHandler.handle(runtime);
    }

    const { intent } = request.payload;

    if (!node.variable && node.slots?.length && intent.slots) {
      variables.merge(utils.mapSlots({ slots: intent.slots, mappings: node.slots.map((slot) => ({ slot, variable: slot })) }));
    }

    // try to match the first slot of the intent to the variable
    if (node.variable) {
      const value = utils.getSlotValue(intent);
      if (value) {
        variables.set(node.variable, value);
      }
    }

    ({ nextId = null } = node);

    // request for this turn has been processed, delete request
    runtime.turn.delete(T.REQUEST);

    return nextId;
  },
});

export default () => CaptureHandler(utilsObj);
