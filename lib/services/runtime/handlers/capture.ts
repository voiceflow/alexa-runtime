import { Node } from '@voiceflow/alexa-types';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { Intent } from 'ask-sdk-model';
import _ from 'lodash';
import wordsToNumbers from 'words-to-numbers';

import { T } from '@/lib/constants';

import { IntentRequest, RequestType } from '../types';
import { addRepromptIfExists } from '../utils';
import CommandHandler from './command';
import RepeatHandler from './repeat';

const utilsObj = {
  wordsToNumbers,
  addRepromptIfExists,
  commandHandler: CommandHandler(),
  repeatHandler: RepeatHandler(),
};

export const CaptureHandler: HandlerFactory<Node.Capture.Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.variable,
  handle: (node, runtime, variables) => {
    const request = runtime.turn.get<IntentRequest>(T.REQUEST);

    if (request?.type !== RequestType.INTENT) {
      utils.addRepromptIfExists({ node, runtime, variables });

      if (node.intent) {
        runtime.turn.set<Intent>(T.DELEGATE, {
          name: node.intent,
          confirmationStatus: 'NONE',
          ...(node.slots && {
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
          }),
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

    // try to match the first slot of the intent to the variable
    // eslint-disable-next-line you-dont-need-lodash-underscore/keys,you-dont-need-lodash-underscore/values
    const value = _.keys(intent.slots).length === 1 && _.values(intent.slots)[0]?.value;

    if (value) {
      const num = utils.wordsToNumbers(value);

      if (typeof num !== 'number' || Number.isNaN(num)) {
        variables.set(node.variable, value);
      } else {
        variables.set(node.variable, num);
      }
    }

    ({ nextId = null } = node);

    // request for this turn has been processed, delete request
    runtime.turn.delete(T.REQUEST);

    return nextId;
  },
});

export default () => CaptureHandler(utilsObj);
