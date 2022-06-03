/* eslint-disable max-depth, sonarjs/cognitive-complexity */
import { State } from '@voiceflow/general-runtime/build/runtime';
import { RequestHandler } from 'ask-sdk';

import { S } from '@/lib/constants';

import { _streamMetaData, AudioDirective, StreamAction, StreamPlay } from '../../runtime/handlers/stream';
import { AlexaHandlerInput, Request } from '../types';
import { update } from './lifecycle';

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
  canHandle(input: AlexaHandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type.startsWith(Request.AUDIO_PLAYER);
  },
  async handle(input: AlexaHandlerInput) {
    const { versionID, runtimeClient } = input.context;
    const rawState = await input.attributesManager.getPersistentAttributes();
    let runtime = runtimeClient.createRuntime(versionID, rawState as State);
    const { storage } = runtime;

    const { request } = input.requestEnvelope;

    const builder = input.responseBuilder;

    const audioPlayerEventName = request.type.split('.')[1];

    switch (audioPlayerEventName) {
      case AudioEvent.PlaybackStarted:
        if (storage.get(S.STREAM_FINISHED) && storage.get(S.STREAM_TEMP)) {
          runtime = runtimeClient.createRuntime(versionID, storage.get(S.STREAM_TEMP) as State);
        } else {
          storage.delete(S.STREAM_FINISHED);
        }
        break;
      case AudioEvent.PlaybackFinished:
        runtime.storage.set(S.STREAM_FINISHED, true);
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
          const tempRuntime = runtimeClient.createRuntime(versionID, rawState as State);
          tempRuntime.storage.set(S.STREAM_PLAY, {
            ...tempRuntime.storage.get<StreamPlay>(S.STREAM_PLAY),
            action: StreamAction.NEXT,
          });

          await utils.update(tempRuntime);

          if (tempRuntime.storage.get<StreamPlay>(S.STREAM_PLAY)?.action === StreamAction.START) {
            const { url, token, metaData } = utils._streamMetaData(tempRuntime.storage.get<StreamPlay>(S.STREAM_PLAY)!);

            if (url && token) {
              tempRuntime.storage.produce((draft: any) => {
                draft[S.STREAM_PLAY].token = token;
              });
              builder.addAudioPlayerPlayDirective(
                AudioDirective.ENQUEUE,
                url,
                token,
                0,
                storage.get<StreamPlay>(S.STREAM_PLAY)!.token,
                metaData
              );
            }
            storage.set(S.STREAM_TEMP, tempRuntime.getRawState());
          }
        } else if (streamPlay.action === StreamAction.RESUME && storage.get(S.STREAM_TEMP)) {
          // resume with next stream present
          const { url, token, metaData } = utils._streamMetaData(
            storage.get<{ [S.STREAM_PLAY]: StreamPlay }>(S.STREAM_TEMP)![S.STREAM_PLAY]
          );

          if (url && token) {
            storage.produce((draft: any) => {
              draft[S.STREAM_TEMP][S.STREAM_PLAY].token = token;
            });
            builder.addAudioPlayerPlayDirective(
              AudioDirective.ENQUEUE,
              url,
              token,
              0,
              storage.get<StreamPlay>(S.STREAM_PLAY)!.token,
              metaData
            );
          }
        }
        break;
      }
      case AudioEvent.PlaybackFailed:
        break;
      default:
        throw new Error('cannot handle event');
    }

    input.attributesManager.setPersistentAttributes(runtime.getRawState());
    return builder.getResponse();
  },
});

export default AudioPlayerEventHandlerGenerator(utilsObj);
