import { Handler } from '@voiceflow/client';
import _ from 'lodash';
import wordsToNumbers from 'words-to-numbers';

import { T } from '@/lib/constants';

import { IntentRequest, RequestType } from '../types';
import { addRepromptIfExists } from '../utils';
import CommandHandler from './command';

export type Capture = {
  variable: string | number;
  reprompt?: string;
  nextId?: string;
};

const CaptureHandler: Handler<Capture> = {
  canHandle: (block) => {
    return !!block.variable;
  },
  handle: (block, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;

    if (request?.type !== RequestType.INTENT) {
      addRepromptIfExists(block, context, variables);

      // quit cycleStack without ending session
      context.end();

      return block.blockID ?? null;
    }

    let nextId: string | null = null;

    const { intent } = request.payload;

    // check if there is a command in the stack that fulfills intent
    nextId = CommandHandler.handle(context, variables);

    if (!nextId) {
      // try to match the first slot of the intent to the variable
      const input = _.keys(intent.slots).length === 1 ? _.values(intent.slots)[0]?.value : null;

      if (input) {
        const num = wordsToNumbers(input);

        if (typeof num !== 'number' || Number.isNaN(num)) {
          variables.set(block.variable, input);
        } else {
          variables.set(block.variable, num);
        }
      }

      ({ nextId = null } = block);
    }

    // request for this turn has been processed, delete request
    context.turn.set(T.REQUEST, null);

    return nextId;
  },
};

export default CaptureHandler;
