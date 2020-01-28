import { T } from '@/lib/constants';

import { Handler } from '../types';

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
