import { HandlerInput, RequestHandler } from 'ask-sdk';
import { Intent } from 'ask-sdk-model';

import IntentHandler from './intent';

const PlaybackControllerHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type.startsWith('PlaybackController');
  },
  handle: (input: HandlerInput) => {
    const { request } = input.requestEnvelope as any;

    // translate PlaybackController commands into intents
    const command = request.type.split('.')[1];
    const intent: Intent = { name: '', confirmationStatus: null };

    switch (command) {
      case 'PlaybackController.NextCommandIssued':
        intent.name = 'AMAZON.NextIntent';
        break;
      case 'PlaybackController.PreviousCommandIssued':
        intent.name = 'AMAZON.PreviousIntent';
        break;
      case 'PlaybackController.PlayCommandIssued':
        intent.name = 'AMAZON.ResumeIntent';
        break;
      case 'PlaybackController.PauseCommandIssued':
        intent.name = 'AMAZON.PauseIntent';
        break;
      default:
        intent.name = '';
    }
    request.intent = intent;

    return IntentHandler.handle(input);
  },
};

export default PlaybackControllerHandler;
