import { HandlerInput, RequestHandler } from 'ask-sdk';
import { Intent } from 'ask-sdk-model';

import IntentHandler from './intent';

enum Command {
  NEXT = 'NextCommandIssued',
  PREV = 'PreviousCommandIssued',
  PLAY = 'PlayCommandIssued',
  PAUSE = 'PauseCommandIssued',
}

enum IntentName {
  NEXT = 'AMAZON.NextIntent',
  PREV = 'AMAZON.PreviousIntent',
  PAUSE = 'AMAZON.PauseIntent',
  RESUME = 'AMAZON.ResumeIntent',
  FALLBACK = 'AMAZON.FallbackIntent',
}

const PlaybackControllerHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type.startsWith('PlaybackController');
  },
  handle: (input: HandlerInput) => {
    const { request } = input.requestEnvelope;

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

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    request.intent = intent;

    return IntentHandler.handle(input);
  },
};

export default PlaybackControllerHandler;
