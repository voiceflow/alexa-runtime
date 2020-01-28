import _ from 'lodash';
import wordsToNumbers from 'words-to-numbers';

import { T } from '@/lib/constants';

import { Handler, IntentRequest, Mapping, RequestType } from '../types';
import { addRepromptIfExists, findAlexaCommand, mapSlots } from '../utils';

const CaptureHandler: Handler = {
  canHandle: (block) => {
    return !!block.variable;
  },
  handle: (block, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;

    if (request?.type !== RequestType.INTENT) {
      addRepromptIfExists(block, context, variables);
      // quit cycleStack without ending session
      context.end();
      return block.id;
    }

    let nextId: string;
    let variableMap: Mapping[];

    const { intent } = request.payload;
    const input = _.keys(intent.slots).length === 1 ? _.values(intent.slots)[0]?.value : null;

    const commandData = findAlexaCommand(intent.name, context);
    if (commandData) {
      ({ nextId, variableMap } = commandData);
    } else if (input) {
      const num = wordsToNumbers(input);

      if (typeof num !== 'number' || Number.isNaN(num)) {
        variables.set(block.variable, input);
      } else {
        variables.set(block.variable, num);
      }

      ({ nextId } = block);
    }

    if (variableMap) {
      // map request mappings to variables
      variables.merge(mapSlots(variableMap, intent.slots));
    }

    // request for this turn has been processed, delete request
    context.turn.set(T.REQUEST, null);

    return nextId;
  },
};

export default CaptureHandler;
