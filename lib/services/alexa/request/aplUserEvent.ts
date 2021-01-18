import { RequestHandler } from 'ask-sdk';
import { interfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { DOCUMENT_VIDEO_TYPE, ENDED_EVENT_PREFIX } from '@/lib/services/runtime/handlers/display/constants';
import { DisplayInfo } from '@/lib/services/runtime/handlers/display/types';
import { isVideoEvent } from '@/lib/services/runtime/handlers/display/utils';

import { AlexaHandlerInput } from '../types';
import { updateRuntime } from '../utils';
import IntentHandler from './intent';

export enum Request {
  APL_USER_EVENT = 'Alexa.Presentation.APL.UserEvent',
}

export enum SourceHandler {
  END = 'End',
  PLAY = 'Play',
}

const utilsObj = { updateRuntime, IntentHandler };

export const APLUserEventHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: AlexaHandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.APL_USER_EVENT;
  },
  async handle(input: AlexaHandlerInput) {
    const request = input.requestEnvelope.request as interfaces.alexa.presentation.apl.UserEvent;

    let hasDisplayInfo = false;
    await utils.updateRuntime(input, (runtime) => {
      const source = request.source as undefined | { id: string; type: string; handler: string };

      runtime.storage.produce<{ [S.DISPLAY_INFO]: DisplayInfo | undefined }>((state) => {
        let displayInfo = state[S.DISPLAY_INFO];

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
