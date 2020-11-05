import { Node } from '@voiceflow/alexa-types/build/nodes/accountLinking';
import { HandlerFactory } from '@voiceflow/runtime';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export const AccountLinkingResponseBuilder: ResponseBuilder = (context, builder) => {
  // check account linking
  if (context.turn.get(T.ACCOUNT_LINKING)) {
    builder.withLinkAccountCard();
  }
};

const AccountLinkingHandler: HandlerFactory<Node> = () => ({
  canHandle: (node) => !!node.link_account,
  handle: (node, context) => {
    context.turn.set(T.ACCOUNT_LINKING, true);

    return node.nextId ?? null;
  },
});

export default AccountLinkingHandler;
