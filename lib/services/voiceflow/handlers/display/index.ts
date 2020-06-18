import { HandlerFactory } from '@voiceflow/client';
import { SupportedInterfaces } from 'ask-sdk-model';
import _ from 'lodash';

import { S } from '@/lib/constants';
import { FullServiceMap } from '@/lib/services';

import { APL_INTERFACE_NAME, ENDED_EVENT_PREFIX, EVENT_SEND_EVENT } from './constants';
import * as events from './events';
import DisplayResponseBuilder from './responseBuilder';
import { Command, DisplayInfo } from './types';
import { deepFindVideos, VideoEvent } from './utils';

export { events, DisplayResponseBuilder };

export type Display = {
  nextId?: string;
  display_id?: number;
  datasource?: string;
  apl_commands?: Command[] | string;
  update_on_change?: boolean;
};

export const getVariables = (str: string): string[] => {
  return (str.match(/\{[\w\d]+\}/g) || []).map((s) => s.slice(1, -1));
};

const utilsObj = {
  deepFindVideos,
  getVariables,
};

export const DisplayHandler: HandlerFactory<Display, typeof utilsObj> = (utils) => ({
  canHandle: (block) => {
    console.log('display handler - canHandle', block);

    return !!block.display_id;
  },
  handle: async (block, context) => {
    console.log('in display intent handle');
    const supportedInterfaces: SupportedInterfaces | undefined = context.storage.get(S.SUPPORTED_INTERFACES);
    const nextId = block.nextId ?? null;

    if (!supportedInterfaces?.[APL_INTERFACE_NAME]) {
      return nextId;
    }

    const services = context.services as FullServiceMap;
    const displayID = block.display_id as number;
    const dataSource = block.datasource ?? '';

    let commands;
    if (block.apl_commands && _.isString(block.apl_commands)) {
      try {
        commands = JSON.parse(block.apl_commands) as Command[];
      } catch {
        // invalid JSON
      }
    }

    const displayInfo: DisplayInfo = {
      commands,
      dataSource,
      playingVideos: {},
      shouldUpdate: true,
      currentDisplay: displayID,
      dataSourceVariables: utils.getVariables(dataSource),
    };

    context.storage.set(S.DISPLAY_INFO, displayInfo);

    const document = await services.multimodal.getDisplayDocument(displayID);

    if (!document) {
      return nextId;
    }

    const results = utils.deepFindVideos(document);

    const onEndEvents = _.flatMap(results, (result) => result.item.onEnd).filter(Boolean) as VideoEvent[];

    const hasOnEndEvent = onEndEvents.some((event) => event.type === EVENT_SEND_EVENT && event.arguments?.includes?.(ENDED_EVENT_PREFIX));

    console.log('hasOnEndEvent', hasOnEndEvent);
    console.log('Block', block);
    if (hasOnEndEvent) {
      context.stack.top().setBlockID(block.nextId ?? null);
      console.log('context stack', context.stack);
      console.log('context end', context.end);
      context.end();

      return null;
    }

    return nextId;
  },
});

export default () => DisplayHandler(utilsObj);
