import { AlexaNode } from '@voiceflow/alexa-types';
import { BaseNode } from '@voiceflow/base-types';
import { replaceVariables } from '@voiceflow/common';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { SupportedInterfaces } from 'ask-sdk-model';
import _ from 'lodash';

import { S } from '@/lib/constants';
import { FullServiceMap } from '@/lib/services';

import { APL_INTERFACE_NAME, ENDED_EVENT_PREFIX, EVENT_SEND_EVENT } from './constants';
import * as events from './events';
import DisplayResponseBuilder from './responseBuilder';
import { Command, DisplayInfo } from './types';
import { deepFindVideos, isVideoEvent, VideoEvent } from './utils';

export { DisplayResponseBuilder, events };

export interface DisplayNode extends BaseNode.Utils.BaseNode {
  type: AlexaNode.NodeType.DISPLAY;
  nextId?: string;
  display_id?: number;
  datasource?: string;
  apl_commands?: Command[] | string;
  update_on_change?: boolean;
}

export const getVariables = (str: string): string[] => {
  return (str.match(/{\w+}/g) || []).map((s) => s.slice(1, -1));
};

const utilsObj = {
  getVariables,
  deepFindVideos,
  replaceVariables,
};

export const DisplayHandler: HandlerFactory<DisplayNode, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.display_id,
  handle: async (node, runtime) => {
    const supportedInterfaces: SupportedInterfaces | undefined = runtime.storage.get(S.SUPPORTED_INTERFACES);
    const variables = runtime.variables.getState();

    const nextId = node.nextId ?? null;

    if (!supportedInterfaces?.[APL_INTERFACE_NAME]) {
      return nextId;
    }

    const services = runtime.services as FullServiceMap;
    const displayID = node.display_id as number;
    const dataSource = node.datasource ?? '';

    let commands;
    if (node.apl_commands && _.isString(node.apl_commands)) {
      try {
        commands = JSON.parse(utils.replaceVariables(node.apl_commands, variables)) as Command[];
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

    runtime.storage.set(S.DISPLAY_INFO, displayInfo);

    const document = await services.multimodal.getDisplayDocument(displayID);

    if (!document) {
      return nextId;
    }

    const results = utils.deepFindVideos(document);

    const onEndEvents = _.flatMap(results, (result) => result.item.onEnd).filter(Boolean) as VideoEvent[];

    const hasOnEndEvent = onEndEvents.some(
      (event) => event.type === EVENT_SEND_EVENT && event.arguments?.some?.(isVideoEvent(ENDED_EVENT_PREFIX))
    );

    if (hasOnEndEvent) {
      runtime.stack.top().setNodeID(node.nextId ?? null);
      runtime.end();

      return null;
    }

    return nextId;
  },
});

export default () => DisplayHandler(utilsObj);
