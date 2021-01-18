import _ from 'lodash';

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

/*
  Recursively apply _.filter to collection, returning all results in array.
  item refers to the actual object, path refers to the path that the object is located at
*/

export const deepFind = <T = any>(collection: any, predicate: any) => {
  let results: { item: T; path: string[] }[] = [];

  const find = (subCollection: any, path: string[]) => {
    if (!_.isObject(subCollection)) {
      return;
    }

    // resolve TS type
    const _subCollection = subCollection as Record<string, any>;

    const matches = _.filter(_subCollection, predicate);

    if (matches.length) {
      results = results.concat(matches.map((item) => ({ item, path })));
    }

    Object.keys(_subCollection).forEach((key) => find(_subCollection[key], path.concat([key])));
  };

  find(collection, []);

  return results;
};

export const deepFindVideos = (collection: any) => deepFind<Video>(collection, { type: DOCUMENT_VIDEO_TYPE });

export const getEventToSend = (argument: string) => ({ type: EVENT_SEND_EVENT, arguments: [argument] });

export const isVideoEvent = (event: string) => (data?: any) => _.isString(data) && data.toLowerCase().includes(event.toLowerCase());

export const shouldRebuildDisplay = (dataSourceVars: string[] = [], variables: Record<string, any>, lastVariables: Record<string, any> = {}) =>
  dataSourceVars.some((name) => variables[name] !== lastVariables[name]);
