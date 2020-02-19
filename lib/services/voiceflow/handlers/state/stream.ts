import { Handler } from '@voiceflow/client';

import { S, T } from '@/lib/constants';

import { IntentName, IntentRequest } from '../../types';
import { regexVariables } from '../../utils';
import CommandHandler from '../command';
import { StreamAction } from '../stream';

const streamStateHandler: Handler<any> = {
  canHandle: (_, context) => {
    return context.storage.get(S.STREAM_PLAY) && context.storage.get(S.STREAM_PLAY).action !== StreamAction.END;
  },
  handle: (_, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;
    const intentName = request?.payload?.intent?.name || null;
    const streamPlay = context.storage.get(S.STREAM_PLAY);

    let nextId;

    if (intentName === IntentName.PAUSE) {
      if (streamPlay.nextId) {
        // If it is linked to something else, save current pause state
        context.storage.set(S.STREAM_PAUSE, {
          id: streamPlay.PAUSE_ID,
          offset: streamPlay.offset,
        });

        ({ nextId } = streamPlay);
        context.storage.produce((draft) => {
          draft[S.STREAM_PLAY].action = StreamAction.END;
        });
      } else {
        // Literally just PAUSE
        context.storage.produce((draft) => {
          draft[S.STREAM_PLAY].action = StreamAction.PAUSE;
        });
      }
    } else if (intentName === IntentName.RESUME) {
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.RESUME;
      });
    } else if (intentName === IntentName.STARTOVER || intentName === IntentName.REPEAT) {
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.START;
        draft[S.STREAM_PLAY].offset = 0;
      });
    } else if (intentName === IntentName.NEXT || streamPlay.action === StreamAction.NEXT) {
      if (streamPlay.NEXT) {
        nextId = streamPlay.NEXT;
      }

      context.storage.delete(S.STREAM_TEMP);

      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
    } else if (intentName === IntentName.PREV) {
      if (streamPlay.PREVIOUS) {
        nextId = streamPlay.PREVIOUS;
      }

      context.storage.delete(S.STREAM_TEMP);

      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
    } else if (intentName === IntentName.CANCEL) {
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
    } else if (CommandHandler.canHandle(context)) {
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
      return CommandHandler.handle(context, variables);
    } else {
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.NOEFFECT;
      });
      let output: string;
      if (intentName === IntentName.SHUFFLE_OFF || intentName === IntentName.SHUFFLE_ON) {
        output = "Sorry, I can't shuffle audio here";
      } else if (intentName === IntentName.LOOP_OFF || intentName === IntentName.LOOP_ON) {
        output = "Sorry, I can't loop audio yet";
      } else {
        output = "Sorry, I can't do that yet";
      }

      context.storage.produce((draft) => {
        draft.output += output;
      });
    }

    const updatedStreamPlay = context.storage.get(S.STREAM_PLAY);
    if (updatedStreamPlay) {
      const variablesMap = variables.getState();
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].title = regexVariables(updatedStreamPlay.regex_title, variablesMap);
        draft[S.STREAM_PLAY].description = regexVariables(updatedStreamPlay.regex_description, variablesMap);
      });
    }

    // request for this turn has been processed, delete request
    context.turn.set(T.REQUEST, null);
    return nextId;
  },
};

export default streamStateHandler;
