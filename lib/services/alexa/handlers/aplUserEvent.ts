import { HandlerInput, RequestHandler } from 'ask-sdk';
import { interfaces } from 'ask-sdk-model';
import _ from 'lodash';

import { S } from '@/lib/constants';
import { DOCUMENT_VIDEO_TYPE, ENDED_EVENT_PREFIX } from '@/lib/services/voiceflow/handlers/display/constants';
import { DisplayInfo } from '@/lib/services/voiceflow/handlers/display/responseBuilder';

import { updateContext } from '../utils';
import { buildContext, buildResponse } from './lifecycle';

enum Request {
  APL_USER_EVENT = 'Alexa.Presentation.APL.UserEvent',
}

enum SourceHandler {
  END = 'End',
  PLAY = 'Play',
}

const APLUserEventHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.APL_USER_EVENT;
  },
  async handle(input: HandlerInput) {
    const request = input.requestEnvelope.request as interfaces.alexa.presentation.apl.UserEvent;

    await updateContext(input, (context) => {
      const source = request.source as undefined | { id: string; type: string; handler: string };

      context.storage.produce((state) => {
        let displayInfo = state[S.DISPLAY_INFO] as DisplayInfo | undefined;

        if (source?.type === DOCUMENT_VIDEO_TYPE && source?.handler === SourceHandler.END && displayInfo?.playingVideos) {
          delete displayInfo.playingVideos[source.id];
        } else if (source?.type === DOCUMENT_VIDEO_TYPE && source.handler === SourceHandler.PLAY) {
          const videoId = source.id;

          if (!displayInfo) {
            displayInfo = {};
          }

          if (!displayInfo.playingVideos) {
            displayInfo.playingVideos = {};
          }

          displayInfo.playingVideos[videoId] = { started: Date.now() };

          state[S.DISPLAY_INFO] = displayInfo;
        }
      });
    });

    const context = await buildContext(input);

    if (
      context.storage.get(S.AWAITING_VIDEO_ENDED_EVENT) &&
      request.arguments?.some((arg) => _.isString(arg) && arg.toLowerCase().includes(ENDED_EVENT_PREFIX))
    ) {
      return buildResponse(context, input);
    }

    return input.responseBuilder.getResponse();
  },
};

export default APLUserEventHandler;
