import { NodeType } from '@voiceflow/alexa-types';
import { Node } from '@voiceflow/api-sdk';
import { HandlerFactory } from '@voiceflow/client';
import { SupportedInterfaces } from 'ask-sdk-model';
import _ from 'lodash';

import { S } from '@/lib/constants';

import { APL_INTERFACE_NAME, ENDED_EVENT_PREFIX, EVENT_SEND_EVENT } from '../display/constants';
import * as events from '../display/events';
import { Command, DisplayInfoV2 } from '../display/types';
import { deepFindVideos, VideoEvent } from '../display/utils';
import DisplayResponseBuilderV2 from './responseBuilder';

export { events, DisplayResponseBuilderV2 };

export type DisplayNode = Node<
  NodeType.DISPLAY,
  {
    nextId?: string;
    datasource: string;
    document: string;
    apl_commands?: Command[] | string;
    update_on_change?: boolean;
  }
>;

export const getVariables = (str: string): string[] => {
  return (str.match(/\{[\w\d]+\}/g) || []).map((s) => s.slice(1, -1));
};

const utilsObj = {
  deepFindVideos,
  getVariables,
};

export const DisplayHandler: HandlerFactory<DisplayNode, typeof utilsObj> = (utils) => ({
  canHandle: (node) => {
    return !!node.document && !!node.datasource;
  },
  handle: async (node, context) => {
    const supportedInterfaces: SupportedInterfaces | undefined = context.storage.get(S.SUPPORTED_INTERFACES);
    const nextId = node.nextId ?? null;

    if (!supportedInterfaces?.[APL_INTERFACE_NAME]) {
      return nextId;
    }

    const dataSource = node.datasource ?? '';

    let commands;
    if (node.apl_commands && _.isString(node.apl_commands)) {
      try {
        commands = JSON.parse(node.apl_commands) as Command[];
      } catch {
        // invalid JSON
      }
    }

    const { document } = node;

    const displayInfo: DisplayInfoV2 = {
      commands,
      dataSource,
      document,
      playingVideos: {},
      shouldUpdate: true,
      dataSourceVariables: utils.getVariables(dataSource),
    };

    if (!document) {
      return nextId;
    }
    context.storage.set(S.DISPLAY_V2_INFO, displayInfo);

    let documentData;
    try {
      documentData = JSON.parse(document);
    } catch {
      // invalid JSON
    }

    const results = utils.deepFindVideos(documentData);

    const onEndEvents = _.flatMap(results, (result) => result.item.onEnd).filter(Boolean) as VideoEvent[];

    const hasOnEndEvent = onEndEvents.some((event) => event.type === EVENT_SEND_EVENT && event.arguments?.includes?.(ENDED_EVENT_PREFIX));

    if (hasOnEndEvent) {
      context.stack.top().setNodeID(node.nextId ?? null);
      context.end();

      return null;
    }

    return nextId;
  },
});

export default () => DisplayHandler(utilsObj);
