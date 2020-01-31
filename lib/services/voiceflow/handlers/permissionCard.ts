import { T } from '@/lib/constants';

import { Handler } from '../types';

const PermissionCardHandler: Handler = {
  canHandle: (block) => {
    return block.permission_card;
  },
  handle: (block, context) => {
    context.turn.set(T.PERMISSION_CARD, block.permission_card);

    return block.nextId;
  },
};

export default PermissionCardHandler;
