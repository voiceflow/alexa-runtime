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

    if (type.startsWith('PlaybackController')) {
      switch (type) {
        case 'PlaybackController.NextCommandIssued':
          context.turn.set('intent', 'AMAZON.NextIntent');
          break;
        case 'PlaybackController.PreviousCommandIssued':
          context.turn.set('intent', 'AMAZON.PreviousIntent');
          break;
        case 'PlaybackController.PlayCommandIssued':
          context.turn.set('intent', 'AMAZON.ResumeIntent');
          break;
        case 'PlaybackController.PauseCommandIssued':
          context.turn.set('intent', 'AMAZON.PauseIntent');
          break;
        default:
          context.turn.set('intent', '');
      }
    } else {
      context.turn.set('intent', payload.intent.name);
      context.turn.set('slots', payload.intent.slots);
    }

    if (context.stack.isEmpty()) {
      await launch(context, input);
    }

    await update(context);

    return buildResponse(context, input);
  },
};

export default IntentHandler;
