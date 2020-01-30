import { Handler } from '../../types';
import getUserInfo from './utils';

const UserInfoHandler: Handler = {
  canHandle: (block) => {
    return block.permissions;
  },
  handle: async (block, context, variables) => {
    let nextId = block.fail_id;

    const requests = [];
    if (Array.isArray(block.permissions) && block.permissions.length) {
      block.permissions.forEach((p) => requests.push(getUserInfo(p, context, variables)));
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
