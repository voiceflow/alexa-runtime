import { Node } from '@voiceflow/alexa-types/build/nodes/stream';
import { generateHash, replaceVariables } from '@voiceflow/common';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import _ from 'lodash';

import { S, T } from '@/lib/constants';
import { AlexaHandlerInput } from '@/lib/services/alexa/types';

import { ResponseBuilder } from '../types';

export enum StreamAction {
  START = 'START',
  PAUSE = 'PAUSE',
  NEXT = 'NEXT',
  RESUME = 'RESUME',
  NOEFFECT = 'NOEFFECT',
  END = 'END',
}

export enum AudioDirective {
  ENQUEUE = 'ENQUEUE',
  REPLACE_ALL = 'REPLACE_ALL',
}

export type StreamPlay = {
  action: StreamAction;
  url: string;
  loop: boolean;
  offset: number;
  nextId: string;
  token: string;
  PAUSE_ID: string;
  NEXT: string;
  PREVIOUS: string;
  title: string;
  description: string;
  regex_title: string;
  regex_description: string;
  icon_img: string;
  background_img: string;
};

export type StreamPauseStorage = {
  id: string;
  offset: number;
};

export const _streamMetaData = (streamPlay: StreamPlay) => {
  if (!streamPlay || _.isEmpty(streamPlay)) return {};

  const { title, description, icon_img, background_img, url, offset } = streamPlay;

  const metaData: Record<string, any> = {
    title: title || _.last(url.split('/')),
    subtitle: description,
  };

  if (icon_img) {
    metaData.art = {
      sources: [
        {
          url: icon_img,
        },
      ],
    };
  }

  if (background_img) {
    metaData.backgroundImage = {
      sources: [
        {
          url: background_img,
        },
      ],
    };
  }

  const token = generateHash([url, title, description, icon_img, background_img]);

  return { metaData, token, url, offset };
};

const responseUtils = {
  _streamMetaData,
};

export const StreamResponseBuilderGenerator = (u: typeof responseUtils): ResponseBuilder => (runtime, builder) => {
  const handlerInput = runtime.turn.get<AlexaHandlerInput>(T.HANDLER_INPUT);
  const streamPlay = runtime.storage.get<StreamPlay>(S.STREAM_PLAY);

  if (handlerInput?.requestEnvelope.context?.AudioPlayer && streamPlay) {
    runtime.storage.produce((draft) => {
      draft[S.STREAM_PLAY].offset = handlerInput.requestEnvelope.context.AudioPlayer?.offsetInMilliseconds;
    });
  }

  const exitConditions = [StreamAction.START, StreamAction.PAUSE, StreamAction.RESUME, StreamAction.NOEFFECT];
  if (streamPlay && exitConditions.includes(streamPlay.action)) {
    builder.withShouldEndSession(true);
  }

  if (streamPlay) {
    switch (streamPlay.action) {
      case StreamAction.RESUME:
      case StreamAction.START: {
        const { url, token, offset, metaData } = u._streamMetaData(streamPlay);
        if (!!url && !!token) {
          runtime.storage.produce((draft) => {
            draft[S.STREAM_PLAY].token = token;
          });
          builder.addAudioPlayerPlayDirective(AudioDirective.REPLACE_ALL, url, token, offset || 0, undefined, metaData);
        }
        break;
      }
      case StreamAction.END:
        runtime.storage.delete(S.STREAM_PAUSE);
        runtime.storage.delete(S.STREAM_PLAY);
        builder.addAudioPlayerStopDirective();
        break;
      case StreamAction.PAUSE:
        builder.addAudioPlayerStopDirective();
        break;
      default:
      // UNKNOWN CASE EG. SHUFFLE
    }
  }
};

export const StreamResponseBuilder = StreamResponseBuilderGenerator(responseUtils);

const handlerUtils = {
  replaceVariables,
};

export const StreamHandler: HandlerFactory<Node, typeof handlerUtils> = (u) => ({
  canHandle: (node) => {
    return !!node.play;
  },
  handle: (node, runtime, variables) => {
    const variablesMap = variables.getState();
    const audioUrl = u.replaceVariables(node.play, variablesMap);

    runtime.storage.set(S.STREAM_PLAY, {
      action: StreamAction.START,
      url: audioUrl,
      loop: node.loop,
      offset: 0,
      token: node.id,
      nextId: node.nextId,
      PAUSE_ID: node.PAUSE_ID,
      NEXT: node.NEXT,
      PREVIOUS: node.PREVIOUS,
      title: u.replaceVariables(node.title, variablesMap),
      description: u.replaceVariables(node.description, variablesMap),
      regex_title: node.title,
      regex_description: node.description,
      icon_img: u.replaceVariables(node.icon_img, variablesMap),
      background_img: u.replaceVariables(node.background_img, variablesMap),
    } as StreamPlay);

    const streamPause = runtime.storage.get<StreamPauseStorage>(S.STREAM_PAUSE);

    if (streamPause) {
      if (node.PAUSE_ID === streamPause.id) {
        runtime.storage.produce((draft) => {
          draft[S.STREAM_PLAY].offset = streamPause.offset;
          draft[S.STREAM_PLAY].action = StreamAction.PAUSE;
        });
      }

      runtime.storage.delete(S.STREAM_PAUSE);
    }

    runtime.end();

    return null;
  },
});

export default () => StreamHandler(handlerUtils);
