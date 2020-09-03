import { NodeType } from '@voiceflow/alexa-types';
import { Node } from '@voiceflow/api-sdk';
import { HandlerFactory } from '@voiceflow/client';

import { S, T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export type PermissionNode = Node<
  NodeType.PERMISSION,
  {
    permission_card?: string;
    nextId: string;
  }
>;

export const PermissionCardResponseBuilder: ResponseBuilder = (context, builder) => {
  // check permissions card
  const permissionCard = context.turn.get(T.PERMISSION_CARD);
  if (permissionCard) {
    const permissions = Array.isArray(permissionCard) ? permissionCard : context.storage.get(S.ALEXA_PERMISSIONS);
    if (permissions?.length) builder.withAskForPermissionsConsentCard(permissions);
  }
};

const PermissionCardHandler: HandlerFactory<PermissionNode> = () => ({
  canHandle: (node) => {
    return !!node.permission_card;
  },
  handle: (node, context) => {
    context.turn.set(T.PERMISSION_CARD, node.permission_card);

    context.trace.debug('__Permissions__ - entered');

    if (node.nextId) {
      context.trace.debug('Permissions - redirecting to the next node');
    }

    return node.nextId ?? null;
  },
});

export default PermissionCardHandler;
