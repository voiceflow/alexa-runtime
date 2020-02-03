import { Handler } from '@voiceflow/client';

import { Permission } from './constants';
import isPermissionGranted from './utils';

export type UserInfo = {
  fail_id?: string;
  success_id?: string;
  permissions?: Permission[];
};

const UserInfoHandler: Handler<UserInfo> = {
  canHandle: (block) => {
    return !!block.permissions;
  },
  handle: async (block, context, variables) => {
    let nextId = block.fail_id;

    if (Array.isArray(block.permissions) && block.permissions.length) {
      const requests = block.permissions.map((p) => isPermissionGranted(p, context, variables));
      const results = await Promise.all(requests);
      if (!results.includes(false)) {
        nextId = block.success_id;
      }
    } else {
      nextId = block.success_id;
    }

    return nextId;
  },
};

export default UserInfoHandler;
