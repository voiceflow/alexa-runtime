import { HandlerInput, RequestHandler } from 'ask-sdk';
import { SessionEndedRequest } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { DisplayInfo } from '@/lib/services/voiceflow/handlers/display/types';

import { updateContext } from '../utils';

export enum Request {
  SESSION_ENDED = 'SessionEndedRequest',
}

export enum ErrorType {
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  INTERNAL_SERVICE_ERROR = 'INTERNAL_SERVICE_ERROR',
}

export enum RequestReason {
  ERROR = 'ERROR',
}

const utilsObj = {
  // eslint-disable-next-line no-console
  log: console.warn,
  updateContext,
};

export const SessionEndedHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.SESSION_ENDED;
  },
  async handle(input: HandlerInput) {
    const request = input.requestEnvelope.request as SessionEndedRequest;
    const errorType = request.error?.type;

    await utils.updateContext(input, (context) => {
      if (errorType === ErrorType.INVALID_RESPONSE || errorType === ErrorType.INTERNAL_SERVICE_ERROR) {
        // eslint-disable-next-line no-console
        utils.log(
          'errorType=%s, versionID=%s, storage=%s, turn=%s, variables=%s, stack=%s, trace=%s',
          errorType,
          context.versionID,
          JSON.stringify(context.storage.getState()),
          JSON.stringify(context.turn.getState()),
          JSON.stringify(context.variables.getState()),
          JSON.stringify(context.stack.getState()),
          JSON.stringify(context.trace.get())
        );
      }

      if (request.reason === RequestReason.ERROR) {
        // eslint-disable-next-line no-console
        utils.log('error=%s, versionID=%s', JSON.stringify(request), context.versionID);
      }

      const displayInfo = context.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;
      if (displayInfo?.playingVideos) {
        context.storage.produce((state) => {
          const dInfo = state[S.DISPLAY_INFO] as DisplayInfo;
          dInfo.playingVideos = {};
        });
      }
    });

    return input.responseBuilder.getResponse();
  },
});

export default SessionEndedHandlerGenerator(utilsObj);
