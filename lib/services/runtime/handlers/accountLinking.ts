import { AlexaNode } from '@voiceflow/alexa-types';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export const AccountLinkingResponseBuilder: ResponseBuilder = (runtime, builder) => {
  // check account linking
  if (runtime.turn.get(T.ACCOUNT_LINKING)) {
    builder.withLinkAccountCard();
  }
};

const AccountLinkingHandler: HandlerFactory<AlexaNode.AccountLinking.Node> = () => ({
  canHandle: (node) => !!node.link_account,
  handle: (node, runtime) => {
    runtime.turn.set(T.ACCOUNT_LINKING, true);

    return node.nextId ?? null;
  },
});

export default AccountLinkingHandler;
