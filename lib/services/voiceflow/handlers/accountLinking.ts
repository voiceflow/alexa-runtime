import { Handler } from '@voiceflow/client';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export const AccountLinkingResponseBuilder: ResponseBuilder = (context, builder) => {
  // check account linking
  if (context.turn.get(T.ACCOUNT_LINKING)) {
    builder.withLinkAccountCard();
  }
};

export type AccountLinking = {
  link_account?: boolean;
  nextId: string;
};

const AccountLinkingHandler: Handler<AccountLinking> = {
  canHandle: (block) => {
    return !!block.link_account;
  },
  handle: (block, context) => {
    context.turn.set(T.ACCOUNT_LINKING, true);

    return block.nextId ?? null;
  },
};

export default AccountLinkingHandler;
