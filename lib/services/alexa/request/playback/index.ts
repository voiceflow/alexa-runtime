import { HandlerInput, RequestHandler } from 'ask-sdk';
import { Intent, IntentRequest } from 'ask-sdk-model';

import { IntentName } from '@/lib/services/voiceflow/types';

import IntentHandler from '../intent';
import { buildContext } from '../lifecycle';
import { Command } from './types';

const utilsObj = {
  buildContext,
  IntentHandler,
};

export const PlaybackControllerHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type.startsWith('PlaybackController');
  },
  handle: async (input: HandlerInput) => {
    const request = input.requestEnvelope.request as IntentRequest;

    // translate PlaybackController commands into intents
    const command = request.type.split('.')[1];
    const intent: Intent = { name: '', confirmationStatus: 'NONE' };

    switch (command) {
      case Command.NEXT:
        intent.name = IntentName.NEXT;
        break;
      case Command.PREV:
        intent.name = IntentName.PREV;
        break;
      case Command.PLAY:
        intent.name = IntentName.RESUME;
        break;
      case Command.PAUSE:
        intent.name = IntentName.PAUSE;
        break;
      default:
        intent.name = IntentName.FALLBACK;
    }

    // the input request object is non-extensible, read only - create a new one
    const newInput = {
      ...input,
      requestEnvelope: {
        ...input.requestEnvelope,
        request: {
          ...input.requestEnvelope.request,
          type: 'IntentRequest',
          intent,
        } as IntentRequest,
      },
    };

    const response = await utils.IntentHandler.handle(newInput);
    delete response.outputSpeech;
    delete response.reprompt;

    return response;
  },
});

export default PlaybackControllerHandlerGenerator(utilsObj);
