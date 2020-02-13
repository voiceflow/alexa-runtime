import { HandlerInput, RequestHandler } from 'ask-sdk';
import { Intent, IntentRequest } from 'ask-sdk-model';
import Promise from 'bluebird';

import IntentHandler from '../intent';
import { buildContext } from '../lifecycle';
import { Command, IntentName } from './types';
import VideoControl from './videoControl';

const MediaHandlers = [VideoControl];

const PlaybackControllerHandler: RequestHandler = {
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

    request.intent = intent;

    const context = await buildContext(input);

    input.context.context = context;

    const MediaHandler = await Promise.reduce<RequestHandler, RequestHandler | null>(
      MediaHandlers,
      async (result, handler) => {
        if (result) {
          return result;
        }

        if (await handler.canHandle(input)) {
          return handler;
        }

        return null;
      },
      null
    );

    return MediaHandler ? MediaHandler.handle(input) : IntentHandler.handle(input);
  },
};

export default PlaybackControllerHandler;
