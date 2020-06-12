import { HandlerFactory } from '@voiceflow/client';
import { utils } from '@voiceflow/common';
import { HandlerInput } from 'ask-sdk';
import _ from 'lodash';

import { S, T } from '@/lib/constants';

import { ResponseBuilder } from '../types';
import { regexVariables } from '../utils';

export enum StreamAction {
  START = 'START',
  PAUSE = 'PAUSE',
  NEXT = 'NEXT',
  RESUME = 'RESUME',
  NOEFFECT = 'NOEFFECT',
  END = 'END',
}

export enum AudioDirective {
  REPLACE_ALL = 'REPLACE_ALL',
  ENQUEUE = 'ENQUEUE',
}

type StreamBlock = {
  play: string;
  nextId: string;
  NEXT: string;
  PAUSE_ID: string;
  PREVIOUS: string;
  loop: boolean;
  icon_img: string;
  background_img: string;
  description: string;
  title: string;
};

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

  const token = utils.general.generateHash([url, title, description, icon_img, background_img]);

  return { metaData, token, url, offset };
};

const responseUtils = {
  _streamMetaData,
};

export const StreamResponseBuilderGenerator = (u: typeof responseUtils): ResponseBuilder => (context, builder) => {
  const handlerInput = context.turn.get(T.HANDLER_INPUT) as HandlerInput;
  const streamPlay = context.storage.get(S.STREAM_PLAY);

  if (handlerInput?.requestEnvelope.context?.AudioPlayer && streamPlay) {
    context.storage.produce((draft) => {
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
          context.storage.produce((draft) => {
            draft[S.STREAM_PLAY].token = token;
          });
          builder.addAudioPlayerPlayDirective(AudioDirective.REPLACE_ALL, url, token, offset || 0, undefined, metaData);
        }
        break;
      }
      case StreamAction.END:
        context.storage.delete(S.STREAM_PAUSE);
        context.storage.delete(S.STREAM_PLAY);
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
  regexVariables,
};

export const StreamHandler: HandlerFactory<StreamBlock, typeof handlerUtils> = (u) => ({
  canHandle: (block) => {
    return !!block.play;
  },
  handle: (block, context, variables) => {
    const variablesMap = variables.getState();
    const audioUrl = u.regexVariables(block.play, variablesMap);

    context.storage.set(S.STREAM_PLAY, {
      action: StreamAction.START,
      url: audioUrl,
      loop: block.loop,
      offset: 0,
      token: block.blockID,
      nextId: block.nextId,
      PAUSE_ID: block.PAUSE_ID,
      NEXT: block.NEXT,
      PREVIOUS: block.PREVIOUS,
      title: u.regexVariables(block.title, variablesMap),
      description: u.regexVariables(block.description, variablesMap),
      regex_title: block.title,
      regex_description: block.description,
      icon_img: u.regexVariables(block.icon_img, variablesMap),
      background_img: u.regexVariables(block.background_img, variablesMap),
    } as StreamPlay);

    const streamPause = context.storage.get(S.STREAM_PAUSE);
    if (streamPause) {
      if (block.PAUSE_ID === streamPause.id) {
        context.storage.produce((draft) => {
          draft[S.STREAM_PLAY].offset = streamPause.offset;
          draft[S.STREAM_PLAY].action = StreamAction.PAUSE;
        });
      }

      context.storage.delete(S.STREAM_PAUSE);
    }

    context.end();
    return null;
  },
});

export default () => StreamHandler(handlerUtils);
