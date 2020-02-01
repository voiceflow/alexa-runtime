import { T } from '@/lib/constants';

import { Handler, ResponseBuilder } from '../types';

export const AccountLinkingResponseBuilder: ResponseBuilder = (context, builder) => {
  // check account linking
  if (context.turn.get(T.ACCOUNT_LINKING)) builder.withLinkAccountCard();
};

const AccountLinkingHandler: Handler = {
  canHandle: (block) => {
    return block.link_account;
  },
  handle: (block, context) => {
    context.turn.set(T.ACCOUNT_LINKING, true);

    return block.nextId;
  },
};

export default AccountLinkingHandler;
