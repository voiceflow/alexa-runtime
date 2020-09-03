import { HandlerFactory } from '@voiceflow/client';

import { UserInfoNode } from '@/lib/services/voiceflow/handlers/userInfo';

const UserInfoHandler: HandlerFactory<UserInfoNode> = () => ({
  canHandle: (node) => {
    return !!node.permissions;
  },
  handle: (node, context) => {
    context.trace.debug('__user info__ - entered');

    if (node.success_id || node.fail_id) {
      context.trace.debug(
        node.success_id ? '__user info__ - success path triggered' : '__user info__ - success path not provided, redirecting to the fail path'
      );
    }

    return node.success_id ?? node.fail_id ?? null;
  },
});

export default UserInfoHandler;
