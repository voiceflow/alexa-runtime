import { Handler } from '@voiceflow/client';

import { T } from '@/lib/constants';

export type PermissionCard = {
  permission_card?: string;
};

const PermissionCardHandler: Handler<PermissionCard> = {
  canHandle: (block) => {
    return !!block.permission_card;
  },
  handle: (block, context) => {
    context.turn.set(T.PERMISSION_CARD, block.permission_card);

    return block.nextId ?? null;
  },
};

export default PermissionCardHandler;
