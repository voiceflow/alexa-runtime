import { Node } from '@voiceflow/alexa-types/build/nodes/display';
import { replaceVariables } from '@voiceflow/common';
import { HandlerFactory } from '@voiceflow/runtime';
import { SupportedInterfaces } from 'ask-sdk-model';
import _ from 'lodash';

import { S, T } from '@/lib/constants';

import { AlexaRuntimeRequest, RequestType } from '../../types';
import CommandHandler from '../command';
import { getVariables } from '../display';
import { APL_INTERFACE_NAME, ENDED_EVENT_PREFIX, EVENT_SEND_EVENT } from '../display/constants';
import { Command, DisplayInfo } from '../display/types';
import { deepFindVideos, VideoEvent } from '../display/utils';

const utilsObj = {
  getVariables,
  deepFindVideos,
  commandHandler: CommandHandler(),
  replaceVariables,
};

export const DisplayHandler: HandlerFactory<Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.document && !!node.datasource,
  handle: async (node, runtime, variables) => {
    const supportedInterfaces: SupportedInterfaces | undefined = runtime.storage.get(S.SUPPORTED_INTERFACES);
    const nextId = node.nextId ?? null;

    // if stopped on itself, handle the next request
    const request = runtime.turn.get<AlexaRuntimeRequest>(T.REQUEST);
    if (request) {
      if (request.type === RequestType.INTENT) {
        if (utils.commandHandler.canHandle(runtime)) {
          return utils.commandHandler.handle(runtime, variables);
        }
        return nextId;
      }
      if (request.type === RequestType.EVENT && request.payload.event.startsWith(APL_INTERFACE_NAME)) {
        runtime.turn.delete(T.REQUEST);
        return nextId;
      }
    }

    if (!supportedInterfaces?.[APL_INTERFACE_NAME]) {
      return nextId;
    }
    const dataSource = node.datasource ?? '';

    let commands;

    if (node.aplCommands && _.isString(node.aplCommands)) {
      try {
        commands = JSON.parse(utils.replaceVariables(node.aplCommands, variables.getState())) as Command[];
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
    runtime.storage.set(S.DISPLAY_INFO, displayInfo);

    let documentData;
    try {
      // documentData = JSON.parse(document);
      documentData = JSON.parse(utils.replaceVariables(document, variables.getState()));
    } catch {
      // invalid JSON
    }

    const results = utils.deepFindVideos(documentData);

    const onEndEvents = _.flatMap(results, (result) => result.item.onEnd).filter(Boolean) as VideoEvent[];

    const hasOnEndEvent = onEndEvents.some((event) => event.type === EVENT_SEND_EVENT && event.arguments?.includes?.(ENDED_EVENT_PREFIX));

    if (hasOnEndEvent) {
      // stop on itself
      return node.id;
    }

    return nextId;
  },
});

export default () => DisplayHandler(utilsObj);
