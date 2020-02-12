import { HandlerInput, RequestHandler } from 'ask-sdk';
import { SessionEndedRequest } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { DisplayInfo } from '@/lib/services/voiceflow/handlers/display/responseBuilder';

import { updateContext } from '../utils';

enum Request {
  SESSION_ENDED = 'SessionEndedRequest',
}

enum ErrorType {
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  INTERNAL_SERVICE_ERROR = 'INTERNAL_SERVICE_ERROR',
}

enum RequestReason {
  ERROR = 'ERROR',
}

const SessionEndedHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.SESSION_ENDED;
  },
  async handle(input: HandlerInput) {
    const request = input.requestEnvelope.request as SessionEndedRequest;
    const errorType = request.error?.type;

    await updateContext(input, (context) => {
      if (errorType === ErrorType.INVALID_RESPONSE || errorType === ErrorType.INTERNAL_SERVICE_ERROR) {
        // eslint-disable-next-line no-console
        console.warn(
          'errorType=%s, versionID=%s, storage=%s, turn=%s, variables=%s',
          errorType,
          context.versionID,
          JSON.stringify(context.storage.getState()),
          JSON.stringify(context.turn.getState()),
          JSON.stringify(context.variables.getState())
        );
      }

      if (request.reason === RequestReason.ERROR) {
        // eslint-disable-next-line no-console
        console.warn('error=%s, versionID=%s', request, context.versionID);
      }

      const displayInfo = context.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;

      if (displayInfo?.playingVideos) {
        context.storage.produce((state) => {
          const dInfo = state[S.DISPLAY_INFO] as DisplayInfo;

          delete dInfo.playingVideos;
        });
      }
    });

    return input.responseBuilder.getResponse();
  },
};

export default SessionEndedHandler;
