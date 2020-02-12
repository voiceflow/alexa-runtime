import { Handler } from '@voiceflow/client';
import { interfaces, SupportedInterfaces } from 'ask-sdk-model';
import _ from 'lodash';

import { S } from '@/lib/constants';
import { FullServiceMap } from '@/lib/services';

import { regexVariables } from '../../utils';
import { APL_INTERFACE_NAME, ENDED_EVENT_PREFIX, EVENT_SEND_EVENT } from './constants';
import DisplayResponseBuilder, { DisplayInfo } from './responseBuilder';
import { deepFindVideos, VideoEvent } from './utils';

export { DisplayResponseBuilder };

export type Display = {
  nextId?: string;
  display_id?: number;
  datasource?: string;
  apl_commands?: interfaces.alexa.presentation.apl.Command[] | string;
  update_on_change?: boolean;
};

const getVariables = (str: string): string[] => {
  return (str.match(/\{[\w\d]+\}/g) || []).map((s) => s.slice(1, -1));
};

const DisplayHandler: Handler<Display> = {
  canHandle: (block) => {
    return !!block.display_id;
  },
  handle: async (block, context, variables) => {
    const supportedInterfaces: SupportedInterfaces | undefined = context.storage.get(S.SUPPORTED_INTERFACES);
    const nextId = block.nextId ?? null;

    if (!supportedInterfaces?.[APL_INTERFACE_NAME]) {
      return nextId;
    }

    const services = context.services as FullServiceMap;
    const displayID = block.display_id as number;
    const dataSource = block.datasource ?? '';

    const displayInfo: DisplayInfo = {
      commands: block.apl_commands,
      dataSource: regexVariables(dataSource, variables.getState()),
      shouldUpdate: true,
      currentDisplay: displayID,
      lastDataSource: dataSource,
      dataSourceVariables: block.update_on_change ? getVariables(dataSource) : null,
    };

    context.storage.set(S.DISPLAY_INFO, displayInfo);

    const document = await services.multimodal.getDisplayDocument(displayID);

    if (!document) {
      return nextId;
    }

    const results = deepFindVideos(document);

    const onEndEvents = results.map((result) => result.item.onEnd).filter(Boolean) as VideoEvent[];

    const hasOnEndEvent = onEndEvents.some(
      (event) => event.type === EVENT_SEND_EVENT && event.arguments?.some((data) => _.isString(data) && data.includes(ENDED_EVENT_PREFIX))
    );
    // .map((event) => event.type === EVENT_SEND_EVENT && event.arguments?.includes(ENDED_EVENT_PREFIX));

    if (hasOnEndEvent) {
      context.storage.set(S.AWAITING_VIDEO_ENDED_EVENT, true); // APL videoEnded event for Isobar
      context.stack.top().setBlockID(block.nextId ?? null);

      return null;
    }

    return nextId;
  },
};

export default DisplayHandler;
