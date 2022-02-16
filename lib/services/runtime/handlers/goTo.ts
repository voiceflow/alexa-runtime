import { BaseNode } from '@voiceflow/base-types';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { Intent } from 'ask-sdk-model';

import { T } from '@/lib/constants';

import { IntentRequest, RequestType } from '../types';
import CommandHandler from './command';
import { createDelegateIntent } from './utils/directives';

const utilsObj = {
  commandHandler: CommandHandler(),
};

const GoToHandler: HandlerFactory<BaseNode.GoTo.Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => node.type === BaseNode.NodeType.GOTO,
  handle: (node, runtime, variables): string | null => {
    const request = runtime.turn.get<IntentRequest>(T.REQUEST);
    if (request?.type !== RequestType.INTENT) {
      runtime.turn.set<Intent>(T.DELEGATE, createDelegateIntent(node.request.payload.intent.name));

      return node.id;
    }

    request.diagramID = node.request.diagramID;
    // check if there is a command in the stack that fulfills request
    if (utils.commandHandler.canHandle(runtime)) {
      return utils.commandHandler.handle(runtime, variables);
    }

    return node.noMatch?.nodeID || null;
  },
});

export default () => GoToHandler(utilsObj);
