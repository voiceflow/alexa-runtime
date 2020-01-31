import { HandlerInput, RequestHandler } from 'ask-sdk';
import { Intent } from 'ask-sdk-model';

import IntentHandler from './intent';

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
      case 'NextCommandIssued':
        intent.name = 'AMAZON.NextIntent';
        break;
      case 'PreviousCommandIssued':
        intent.name = 'AMAZON.PreviousIntent';
        break;
      case 'PlayCommandIssued':
        intent.name = 'AMAZON.ResumeIntent';
        break;
      case 'PauseCommandIssued':
        intent.name = 'AMAZON.PauseIntent';
        break;
      default:
        intent.name = 'AMAZON.FallbackIntent';
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    request.intent = intent;

    return IntentHandler.handle(input);
  },
};

export default PlaybackControllerHandler;
