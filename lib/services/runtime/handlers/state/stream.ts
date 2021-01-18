/* eslint-disable sonarjs/no-duplicate-string */
import { HandlerFactory, replaceVariables } from '@voiceflow/runtime';

import { S, T } from '@/lib/constants';

import { IntentName, IntentRequest } from '../../types';
import {} from '../../utils';
import CommandHandler from '../command';
import { StreamAction, StreamPauseStorage, StreamPlay } from '../stream';

export const StreamFailPhrase: Record<string, string> = {
  'en-US': 'Sorry, this action isn’t available in this skill. ',
  'en-AU': 'Sorry, this action isn’t available in this skill. ',
  'en-CA': 'Sorry, this action isn’t available in this skill. ',
  'en-GB': 'Sorry, this action isn’t available in this skill. ',
  'en-IN': 'Sorry, this action isn’t available in this skill. ',
  'fr-CA': "Désolé, cette action n'est pas disponible dans cette skill. ",
  'fr-FR': "Désolé, cette action n'est pas disponible dans cette skill. ",
  'es-US': 'Lo siento, esta función no está disponible en esta skill. ',
  'es-ES': 'Lo siento, esta función no está disponible en esta skill. ',
  'es-MX': 'Lo siento, esta función no está disponible en esta skill. ',
  'it-IT': 'Spiacenti, questa funzione non è disponibile in questa skill. ',
  'de-DE': 'Entschuldigung, diese Funktion ist in dieser Skill nicht verfügbar. ',
  'ja-JP': '申し訳ありませんが、この機能はこのアプリケーションでは使用できません。 ',
  'pt-BR': 'Desculpe, esta característica não está disponível nesta skill. ',
  'hi-IN': 'क्षमा करें, यह फ़ंक्शन इस एप्लिकेशन में उपलब्ध नहीं है। ',
};

const utilsObj = {
  commandHandler: CommandHandler(),
  replaceVariables,
};

export const StreamStateHandler: HandlerFactory<any, typeof utilsObj> = (utils) => ({
  canHandle: (_, context) => !!(context.storage.get(S.STREAM_PLAY) && context.storage.get<StreamPlay>(S.STREAM_PLAY)!.action !== StreamAction.END),
  handle: (_, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;
    const intentName = request?.payload?.intent?.name || null;
    const streamPlay = context.storage.get<StreamPlay>(S.STREAM_PLAY)!;

    let nextId;

    if (intentName === IntentName.PAUSE) {
      if (streamPlay.nextId) {
        // If it is linked to something else, save current pause state
        context.storage.set<StreamPauseStorage>(S.STREAM_PAUSE, {
          id: streamPlay.PAUSE_ID,
          offset: streamPlay.offset,
        });

        ({ nextId } = streamPlay);
        context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
          draft[S.STREAM_PLAY].action = StreamAction.END;
        });
      } else {
        // Literally just PAUSE
        context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
          draft[S.STREAM_PLAY].action = StreamAction.PAUSE;
        });
        context.end();
      }
    } else if (intentName === IntentName.RESUME) {
      context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.RESUME;
      });
      context.end();
    } else if (intentName === IntentName.STARTOVER || intentName === IntentName.REPEAT) {
      context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.START;
        draft[S.STREAM_PLAY].offset = 0;
      });
      context.end();
    } else if (intentName === IntentName.NEXT || streamPlay.action === StreamAction.NEXT) {
      if (streamPlay.NEXT) {
        nextId = streamPlay.NEXT;
      }

      context.storage.delete(S.STREAM_TEMP);

      context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
    } else if (intentName === IntentName.PREV) {
      if (streamPlay.PREVIOUS) {
        nextId = streamPlay.PREVIOUS;
      }

      context.storage.delete(S.STREAM_TEMP);

      context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
    } else if (intentName === IntentName.CANCEL) {
      context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.PAUSE;
      });
      context.end();
    } else if (utils.commandHandler.canHandle(context)) {
      context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.END;
      });
      return utils.commandHandler.handle(context, variables);
    } else {
      context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
        draft[S.STREAM_PLAY].action = StreamAction.NOEFFECT;
      });

      context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay; output: string }>((draft) => {
        draft.output += StreamFailPhrase[context.storage.get<string>(S.LOCALE)!] || StreamFailPhrase['en-US'];
      });

      context.end();
    }

    const updatedStreamPlay = context.storage.get<StreamPlay>(S.STREAM_PLAY);

    if (updatedStreamPlay) {
      const variablesMap = variables.getState();

      context.storage.produce<{ [S.STREAM_PLAY]: StreamPlay }>((draft) => {
        draft[S.STREAM_PLAY].title = utils.replaceVariables(updatedStreamPlay.regex_title, variablesMap);
        draft[S.STREAM_PLAY].description = utils.replaceVariables(updatedStreamPlay.regex_description, variablesMap);
      });
    }

    // request for this turn has been processed, delete request
    context.turn.delete(T.REQUEST);

    return nextId ?? null;
  },
});

export default () => StreamStateHandler(utilsObj);
