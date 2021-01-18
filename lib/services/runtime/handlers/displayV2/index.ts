import { Node } from '@voiceflow/alexa-types/build/nodes/display';
import { HandlerFactory, replaceVariables } from '@voiceflow/runtime';
import { SupportedInterfaces } from 'ask-sdk-model';
import _ from 'lodash';

import { S } from '@/lib/constants';

import { getVariables } from '../display';
import { APL_INTERFACE_NAME, ENDED_EVENT_PREFIX, EVENT_SEND_EVENT } from '../display/constants';
import { Command, DisplayInfo } from '../display/types';
import { deepFindVideos, VideoEvent } from '../display/utils';

const utilsObj = {
  getVariables,
  deepFindVideos,
  replaceVariables,
};

export const DisplayHandler: HandlerFactory<Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.document && !!node.datasource,
  handle: async (node, context) => {
    const supportedInterfaces: SupportedInterfaces | undefined = context.storage.get(S.SUPPORTED_INTERFACES);
    const nextId = node.nextId ?? null;

    if (!supportedInterfaces?.[APL_INTERFACE_NAME]) {
      return nextId;
    }
    const variables = context.variables.getState();

    const dataSource = node.datasource ?? '';

    let commands;

    if (node.aplCommands && _.isString(node.aplCommands)) {
      try {
        commands = JSON.parse(utils.replaceVariables(node.aplCommands, variables)) as Command[];
      } catch {
        // invalid JSON
      }
    }

    const { document } = node;

    const displayInfo: DisplayInfo = {
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
    context.storage.set(S.DISPLAY_INFO, displayInfo);

    let documentData;
    try {
      // documentData = JSON.parse(document);
      documentData = JSON.parse(utils.replaceVariables(document, variables));
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
