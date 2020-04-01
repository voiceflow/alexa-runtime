import { Handler } from '@voiceflow/client';

import { UserInfo } from '@/lib/services/voiceflow/handlers/userInfo';

const UserInfoHandler: Handler<UserInfo> = {
  canHandle: (block) => {
    return !!block.permissions;
  },
  handle: (block, context) => {
    context.trace.debug('__User Info__ - entered');

    if (block.success_id || block.fail_id) {
      context.trace.debug(
        block.success_id ? 'User Info - redirecting to the success block' : 'User Info - success link is not provided, redirecting to the fail block'
      );
    }

    return block.success_id ?? block.fail_id ?? null;
  },
};

export default UserInfoHandler;
