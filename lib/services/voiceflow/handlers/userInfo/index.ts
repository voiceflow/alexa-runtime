import { Handler } from '../../types';
import isPermissionGranted from './utils';

const UserInfoHandler: Handler = {
  canHandle: (block) => {
    return block.permissions;
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
