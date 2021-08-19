import { Node } from '@voiceflow/alexa-types';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';

import { S, T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export type PermissionCardTurn = Node.Permission.Node['permission_card'];

export const PermissionCardResponseBuilder: ResponseBuilder = (runtime, builder) => {
  // check permissions card
  const permissionCard = runtime.turn.get<PermissionCardTurn>(T.PERMISSION_CARD);

  if (permissionCard) {
    const permissions = Array.isArray(permissionCard) ? permissionCard : runtime.storage.get<string[]>(S.ALEXA_PERMISSIONS);

    if (permissions?.length) {
      builder.withAskForPermissionsConsentCard(permissions);
    }
  }
};

const PermissionCardHandler: HandlerFactory<Node.Permission.Node> = () => ({
  canHandle: (node) => !!node.permission_card,
  handle: (node, runtime) => {
    runtime.turn.set<PermissionCardTurn>(T.PERMISSION_CARD, node.permission_card);

    runtime.trace.debug('__Permissions__ - entered');

    if (node.nextId) {
      runtime.trace.debug('Permissions - redirecting to the next node');
    }

    return node.nextId ?? null;
  },
});

export default PermissionCardHandler;
