import { IntentRequest } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { DisplayInfo, VideoCommand, VideoCommandType } from '@/lib/services/voiceflow/handlers/display/types';
import { IntentName } from '@/lib/services/voiceflow/types';

import { ContextRequestHandler } from './types';

const MEDIA_CONTROL_INTENTS = [IntentName.PAUSE, IntentName.RESUME];

const EventHandler: ContextRequestHandler = {
  canHandle: (input, context) => {
    const request = input.requestEnvelope.request as IntentRequest;
    const displayInfo = context.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;

    return !!displayInfo && Object.keys(displayInfo.playingVideos).length > 0 && MEDIA_CONTROL_INTENTS.includes(request.intent.name as IntentName);
  },
  async handle(input, context) {
    const request = input.requestEnvelope.request as IntentRequest;
    const command = request.intent.name === IntentName.PAUSE ? VideoCommand.PAUSE : VideoCommand.PLAY;
    const displayInfo = context.storage.get(S.DISPLAY_INFO) as Required<DisplayInfo>;

    const commands = Object.keys(displayInfo.playingVideos).map((id) => ({
      type: VideoCommandType.CONTROL_MEDIA,
      command,
      componentId: id,
    }));

    if (commands.length) {
      input.responseBuilder.addDirective({
        type: 'Alexa.Presentation.APL.ExecuteCommands',
        token: context.versionID,
        commands,
      });
    }

    // deleteInputs(session);

    return input.responseBuilder.getResponse();
  },
};

export default EventHandler;
