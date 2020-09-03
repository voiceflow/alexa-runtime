import { NodeType } from '@voiceflow/alexa-types';
import { Node } from '@voiceflow/api-sdk';
import { HandlerFactory } from '@voiceflow/client';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export const AccountLinkingResponseBuilder: ResponseBuilder = (context, builder) => {
  // check account linking
  if (context.turn.get(T.ACCOUNT_LINKING)) {
    builder.withLinkAccountCard();
  }
};

export type AccountLinkingNode = Node<
  NodeType.ACCOUNT_LINKING,
  {
    link_account?: boolean;
    nextId: string;
  }
>;

const AccountLinkingHandler: HandlerFactory<AccountLinkingNode> = () => ({
  canHandle: (node) => {
    return !!node.link_account;
  },
  handle: (node, context) => {
    context.turn.set(T.ACCOUNT_LINKING, true);

    return node.nextId ?? null;
  },
});

export default AccountLinkingHandler;
