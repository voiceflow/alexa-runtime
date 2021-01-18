import { Node } from '@voiceflow/alexa-types/build/nodes/permission';
import { HandlerFactory } from '@voiceflow/runtime';

import { S, T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export type PermissionCardTurn = Node['permission_card'];

export const PermissionCardResponseBuilder: ResponseBuilder = (context, builder) => {
  // check permissions card
  const permissionCard = context.turn.get<PermissionCardTurn>(T.PERMISSION_CARD);

  if (permissionCard) {
    const permissions = Array.isArray(permissionCard) ? permissionCard : context.storage.get<string[]>(S.ALEXA_PERMISSIONS);

    if (permissions?.length) {
      builder.withAskForPermissionsConsentCard(permissions);
    }
  }
};

const PermissionCardHandler: HandlerFactory<Node> = () => ({
  canHandle: (node) => !!node.permission_card,
  handle: (node, context) => {
    context.turn.set<PermissionCardTurn>(T.PERMISSION_CARD, node.permission_card);

    context.trace.debug('__Permissions__ - entered');

    if (node.nextId) {
      context.trace.debug('Permissions - redirecting to the next node');
    }

    return node.nextId ?? null;
  },
});

export default PermissionCardHandler;
