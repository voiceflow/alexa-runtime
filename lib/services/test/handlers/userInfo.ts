import { HandlerFactory } from '@voiceflow/client';

import { UserInfo } from '@/lib/services/voiceflow/handlers/userInfo';

const UserInfoHandler: HandlerFactory<UserInfo> = () => ({
  canHandle: (block) => {
    return !!block.permissions;
  },
  handle: (block, context) => {
    context.trace.debug('__user info__ - entered');

    if (block.success_id || block.fail_id) {
      context.trace.debug(
        block.success_id ? '__user info__ - success path triggered' : '__user info__ - success path not provided, redirecting to the fail path'
      );
    }

    return block.success_id ?? block.fail_id ?? null;
  },
});

export default UserInfoHandler;
