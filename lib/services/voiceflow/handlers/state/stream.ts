import { Handler } from '@voiceflow/client';

import { S, T } from '@/lib/constants';

import { IntentRequest } from '../../types';
import { regexVariables } from '../../utils';
import CommandHandler from '../command';
import { StreamAction } from '../stream';

enum PlayIntent {
  Pause = 'AMAZON.PauseIntent',
  Resume = 'AMAZON.ResumeIntent',
  StartOver = 'AMAZON.StartOverIntent',
  Repeat = 'AMAZON.RepeatIntent',
  Next = 'AMAZON.NextIntent',
  Previous = 'AMAZON.PreviousIntent',
  Cancel = 'AMAZON.CancelIntent',
  ShuffleOff = 'AMAZON.ShuffleOffIntent',
  ShuffleOn = 'AMAZON.ShuffleOnIntent',
  LoopOn = 'AMAZON.LoopOnIntent',
  LoopOff = 'AMAZON.LoopOffIntent',
}

const streamStateHandler: Handler<any> = {
  canHandle: (_, context) => {
    return context.storage.get(S.STREAM_PLAY) && context.storage.get(S.STREAM_PLAY).action !== StreamAction.END;
  },
  handle: (_, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;
    const intentName = request?.payload?.intent?.name || null;
    const streamPlay = context.storage.get(S.STREAM_PLAY);

    let nextId;

    if (intentName === PlayIntent.Pause) {
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
    } else if (intentName === PlayIntent.Resume) {
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.RESUME;
      });
    } else if (intentName === PlayIntent.StartOver || intentName === PlayIntent.Repeat) {
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.START;
        draft[S.STREAM_PLAY].offset = 0;
      });
    } else if (intentName === PlayIntent.Next || streamPlay.action === StreamAction.NEXT) {
      if (streamPlay.NEXT) {
        nextId = streamPlay.NEXT;
      }

      context.storage.delete(S.STREAM_TEMP);

      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
    } else if (intentName === PlayIntent.Previous) {
      if (streamPlay.PREVIOUS) {
        nextId = streamPlay.PREVIOUS;
      }

      context.storage.delete(S.STREAM_TEMP);

      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
    } else if (intentName === PlayIntent.Cancel) {
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
    } else {
      nextId = CommandHandler.handle(context, variables);

      if (context.hasEnded()) {
        // Command found
        context.storage.produce((draft) => {
          draft[S.STREAM_PLAY].action = StreamAction.END;
        });
      } else {
        context.storage.produce((draft) => {
          draft[S.STREAM_PLAY].action = StreamAction.NOEFFECT;
        });
        let output: string;
        if (intentName === PlayIntent.ShuffleOff || intentName === PlayIntent.ShuffleOn) {
          output = "Sorry, I can't shuffle audio here";
        } else if (intentName === PlayIntent.LoopOff || intentName === PlayIntent.LoopOn) {
          output = "Sorry, I can't loop audio yet";
        } else {
          output = "Sorry, I can't do that yet";
        }

        context.storage.produce((draft) => {
          draft.output += output;
        });
      }
    }

    const updatedStreamPlay = context.storage.get(S.STREAM_PLAY);
    if (updatedStreamPlay) {
      const variablesMap = variables.getState();
      context.storage.produce((draft) => {
        draft[S.STREAM_PLAY].title = regexVariables(updatedStreamPlay.regex_title, variablesMap);
        draft[S.STREAM_PLAY].description = regexVariables(updatedStreamPlay.regex_description, variablesMap);
      });
    }

    return nextId;
  },
};

export default streamStateHandler;
