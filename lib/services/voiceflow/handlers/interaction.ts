import { Choice, Handler } from '@voiceflow/client';

import { R } from '@/lib/constants';

import { addRepromptIfExists, formatName, mapVariables } from '../utils';

const InteractionHandler: Handler = {
  canHandle: (block) => {
    return !!block.interactions;
  },
  handle: (block, context, variables) => {
    const { payload: reqPayload } = context.getRequest();

    if (!reqPayload.get(R.INTENT)) {
      addRepromptIfExists(block, context, variables);
      // quit cycleStack without ending session
      context.end();
      return block.id;
    }

    let nextId: string;

    const intentName = reqPayload.get(R.INTENT).name;
    block.interactions.forEach((choice: Choice, i: number) => {
      if (choice.intent && formatName(choice.intent) === intentName) {
        reqPayload.set(R.MAPPINGS, choice.mappings);
        nextId = block.nextIds[choice.nextIdIndex || choice.nextIdIndex === 0 ? choice.nextIdIndex : i];
      }
    });
    if (nextId === undefined) {
      // TODO: check if there is a command that fulfills intent. Otherwise nextId is elseId.
      nextId = block.elseId;
    }

    // map request mappings to variables
    mapVariables(context, variables, block.overwrite);

    // intent has been processed. can be deleted from request
    reqPayload.delete(R.INTENT);

    return nextId;
  },
};

export default InteractionHandler;
