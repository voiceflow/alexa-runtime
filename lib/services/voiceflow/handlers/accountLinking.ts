import { Handler } from '@voiceflow/client';

import { T } from '@/lib/constants';

export type AccountLinking = {
  link_account?: boolean;
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
