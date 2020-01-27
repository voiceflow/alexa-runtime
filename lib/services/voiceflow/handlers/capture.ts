import _ from 'lodash';
import wordsToNumbers from 'words-to-numbers';

import { T } from '@/lib/constants';

import { Handler, IntentRequest, RequestType } from '../types';
import { addRepromptIfExists, findAlexaCommand } from '../utils';

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
    // TODO: variableMap
    // let variableMap: Mapping[];

    const { intent } = request.payload;
    // TODO: transformInput?
    const input = _.values(intent.slots)[0]?.value;

    const commandData = findAlexaCommand(intent.name, context);
    // TODO: add enteringNewDiagram if
    if (commandData) {
      ({ nextId /* , variableMap */ } = commandData);
    } else if (input) {
      const num = wordsToNumbers(input);

      if (typeof num !== 'number' || Number.isNaN(num)) {
        variables.set(block.variable, input);
      } else {
        variables.set(block.variable, num);
      }

      ({ nextId } = block);
    }

    // request for this turn has been processed, delete request
    context.turn.set(T.REQUEST, null);

    return nextId;
  },
};

export default CaptureHandler;
