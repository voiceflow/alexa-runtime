import { HandlerInput, RequestHandler } from 'ask-sdk';

import { buildContext, buildResponse, launch, update } from './lifecycle';

const IntentHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type === 'IntentRequest' || type.startsWith('PlaybackController');
  },
  async handle(input: HandlerInput) {
    const { type, ...payload } = input.requestEnvelope.request as any;
    const context = await buildContext(input, { type, payload });

    // TODO: improve this when working on displays
    if (type.startsWith('PlaybackController')) {
      const { intent } = payload;
      switch (type) {
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
      payload.intent = intent;
    }

    if (context.stack.isEmpty()) {
      await launch(context, input);
    }

    await update(context);

    return buildResponse(context, input);
  },
};

export default IntentHandler;
