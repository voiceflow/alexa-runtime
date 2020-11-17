import { HandlerInput, RequestHandler } from 'ask-sdk';
import { interfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { DOCUMENT_VIDEO_TYPE, ENDED_EVENT_PREFIX } from '@/lib/services/voiceflow/handlers/display/constants';
import { DisplayInfo } from '@/lib/services/voiceflow/handlers/display/types';
import { isVideoEvent } from '@/lib/services/voiceflow/handlers/display/utils';

import { updateContext } from '../utils';
import IntentHandler from './intent';

export enum Request {
  APL_USER_EVENT = 'Alexa.Presentation.APL.UserEvent',
}

export enum SourceHandler {
  END = 'End',
  PLAY = 'Play',
}

const utilsObj = { updateContext, IntentHandler };

export const APLUserEventHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.APL_USER_EVENT;
  },
  async handle(input: HandlerInput) {
    const request = input.requestEnvelope.request as interfaces.alexa.presentation.apl.UserEvent;

    let hasDisplayInfo = false;
    await utils.updateContext(input, (context) => {
      const source = request.source as undefined | { id: string; type: string; handler: string };

      context.storage.produce((state) => {
        let displayInfo = state[S.DISPLAY_INFO] as DisplayInfo | undefined;

        if (source?.type === DOCUMENT_VIDEO_TYPE && source.handler === SourceHandler.END && displayInfo) {
          delete displayInfo.playingVideos[source.id];
        } else if (source?.type === DOCUMENT_VIDEO_TYPE && source.handler === SourceHandler.PLAY) {
          const videoId = source.id;

          if (!displayInfo) {
            displayInfo = {
              playingVideos: {},
            };
          }

          displayInfo.playingVideos[videoId] = { started: Date.now() };

          state[S.DISPLAY_INFO] = displayInfo;
        }

        if (state[S.DISPLAY_INFO]) hasDisplayInfo = true;
      });
    });

    if (hasDisplayInfo && request.arguments?.some?.(isVideoEvent(ENDED_EVENT_PREFIX))) {
      return utils.IntentHandler.handle(input);
    }

    return input.responseBuilder.getResponse();
  },
});

export default APLUserEventHandlerGenerator(utilsObj);
