import { S, T } from '@/lib/constants';

import { Handler, ResponseBuilder } from '../types';

export const PermissionCardResponseBuilder: ResponseBuilder = (context, builder) => {
  // check permissions card
  const permissionCard = context.turn.get(T.PERMISSION_CARD);
  if (permissionCard) {
    const permissions = Array.isArray(permissionCard) ? permissionCard : context.storage.get(S.ALEXA_PERMISSIONS);
    if (permissions?.length) builder.withAskForPermissionsConsentCard(permissions);
  }
};

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
