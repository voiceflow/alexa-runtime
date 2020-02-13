import { Context } from '@voiceflow/client';
import { HandlerInput, RequestHandler } from 'ask-sdk';
import { IntentRequest } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { FullServiceMap } from '@/lib/services';
import { DisplayInfo } from '@/lib/services/voiceflow/handlers/display/responseBuilder';

import { IntentName } from './types';

const MEDIA_CONTROL_INTENTS = [IntentName.PAUSE, IntentName.RESUME];

enum VideoCommandType {
  CONTROL_MEDIA = 'ControlMedia',
}

enum VideoCommand {
  PLAY = 'play',
  PAUSE = 'pause',
}

const EventHandler: RequestHandler = {
  canHandle: (input: HandlerInput) => {
    const context = input.context.context as Context;
    const request = input.requestEnvelope.request as IntentRequest;
    const displayInfo = context.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;

    return (
      !!displayInfo?.playingVideos &&
      Object.keys(displayInfo?.playingVideos).length > 0 &&
      MEDIA_CONTROL_INTENTS.includes(request.intent.name as IntentName)
    );
  },
  async handle(input: HandlerInput) {
    const context = input.context.context as Context;
    const request = input.requestEnvelope.request as IntentRequest;
    const command = request.intent.name === IntentName.PAUSE ? VideoCommand.PAUSE : VideoCommand.PLAY;
    const displayInfo = context.storage.get(S.DISPLAY_INFO) as Required<DisplayInfo>;

    const commands = Object.keys(displayInfo.playingVideos).map((id) => ({
      type: VideoCommandType.CONTROL_MEDIA,
      command,
      componentId: id,
    }));

    if (commands.length) {
      const services = context.services as FullServiceMap;

      input.responseBuilder.addDirective({
        type: 'Alexa.Presentation.APL.ExecuteCommands',
        token: services.hashids.encode(context.versionID),
        commands,
      });
    }

    // deleteInputs(session);

    return input.responseBuilder.getResponse();
  },
};

export default EventHandler;
