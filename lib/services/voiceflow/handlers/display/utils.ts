import { deepFind } from '@/lib/utils';

import { DOCUMENT_VIDEO_TYPE, EVENT_SEND_EVENT } from './constants';

export type VideoEvent = {
  type: string;
  arguments?: (string | object | number | null)[];
};

export type Video = {
  id?: string;
  onEnd?: VideoEvent | VideoEvent[];
  onPlay?: VideoEvent | VideoEvent[];
};

export const deepFindVideos = (collection: any) => deepFind<Video>(collection, { type: DOCUMENT_VIDEO_TYPE });

export const getEventToSend = (argument: string) => ({ type: EVENT_SEND_EVENT, arguments: [argument] });
