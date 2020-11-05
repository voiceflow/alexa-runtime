/* eslint-disable max-depth */
import Client, { State } from '@voiceflow/runtime';
import { HandlerInput, RequestHandler } from 'ask-sdk';

import { S } from '@/lib/constants';

import { _streamMetaData, AudioDirective, StreamAction, StreamPlay } from '../../voiceflow/handlers/stream';
import { update } from './lifecycle';

export enum Request {
  AUDIO_PLAYER = 'AudioPlayer.',
}

export enum AudioEvent {
  PlaybackStarted = 'PlaybackStarted',
  PlaybackFinished = 'PlaybackFinished',
  PlaybackStopped = 'PlaybackStopped',
  PlaybackNearlyFinished = 'PlaybackNearlyFinished',
  PlaybackFailed = 'PlaybackFailed',
}

const utilsObj = {
  _streamMetaData,
  update,
};

export const AudioPlayerEventHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type.startsWith(Request.AUDIO_PLAYER);
  },
  async handle(input: HandlerInput) {
    const { versionID, voiceflow } = input.context as { versionID: string; voiceflow: Client };
    const rawState = await input.attributesManager.getPersistentAttributes();
    let context = voiceflow.createContext(versionID, rawState as State);
    const { storage } = context;

    const { request } = input.requestEnvelope;

    const builder = input.responseBuilder;

    const audioPlayerEventName = request.type.split('.')[1];

    switch (audioPlayerEventName) {
      case AudioEvent.PlaybackStarted:
        if (storage.get(S.STREAM_FINISHED) && storage.get(S.STREAM_TEMP)) {
          context = voiceflow.createContext(versionID, storage.get(S.STREAM_TEMP) as State);
        } else {
          storage.delete(S.STREAM_FINISHED);
        }
        break;
      case AudioEvent.PlaybackFinished:
        context.storage.set(S.STREAM_FINISHED, true);
        break;
      case AudioEvent.PlaybackStopped:
        break;
      case AudioEvent.PlaybackNearlyFinished: {
        // determine if there is another stream after this
        const streamPlay = storage.get<StreamPlay>(S.STREAM_PLAY);
        if (!streamPlay) break;

        if (streamPlay.loop) {
          // currect stream loops
          const { url, token, metaData } = utils._streamMetaData(streamPlay);

          if (url && token) {
            storage.produce((draft: any) => {
              draft[S.STREAM_PLAY].token = token;
            });
            builder.addAudioPlayerPlayDirective(AudioDirective.ENQUEUE, url, token, 0, token, metaData);
          }
        } else if (streamPlay.action === StreamAction.START && !storage.get(S.STREAM_TEMP)) {
          // check for next stream
          const tempContext = voiceflow.createContext(versionID, rawState as State);
          tempContext.storage.set(S.STREAM_PLAY, { ...tempContext.storage.get<StreamPlay>(S.STREAM_PLAY), action: StreamAction.NEXT });

          await utils.update(tempContext);

          if (tempContext.storage.get<StreamPlay>(S.STREAM_PLAY)?.action === StreamAction.START) {
            const { url, token, metaData } = utils._streamMetaData(tempContext.storage.get<StreamPlay>(S.STREAM_PLAY)!);

            if (url && token) {
              tempContext.storage.produce((draft: any) => {
                draft[S.STREAM_PLAY].token = token;
              });
              builder.addAudioPlayerPlayDirective(AudioDirective.ENQUEUE, url, token, 0, storage.get<StreamPlay>(S.STREAM_PLAY)!.token, metaData);
            }
            storage.set(S.STREAM_TEMP, tempContext.getRawState());
          }
        } else if (streamPlay.action === StreamAction.RESUME && storage.get(S.STREAM_TEMP)) {
          // resume with next stream present
          const { url, token, metaData } = utils._streamMetaData(storage.get<{ [S.STREAM_PLAY]: StreamPlay }>(S.STREAM_TEMP)![S.STREAM_PLAY]);

          if (url && token) {
            storage.produce((draft: any) => {
              draft[S.STREAM_TEMP][S.STREAM_PLAY].token = token;
            });
            builder.addAudioPlayerPlayDirective(AudioDirective.ENQUEUE, url, token, 0, storage.get<StreamPlay>(S.STREAM_PLAY)!.token, metaData);
          }
        }
        break;
      }
      case AudioEvent.PlaybackFailed:
        break;
      default:
        throw new Error('cannot handle event');
    }

    input.attributesManager.setPersistentAttributes(context.getRawState());
    return builder.getResponse();
  },
});

export default AudioPlayerEventHandlerGenerator(utilsObj);
