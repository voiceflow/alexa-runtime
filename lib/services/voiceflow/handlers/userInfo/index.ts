import { Node } from '@voiceflow/alexa-types/build/nodes/userInfo';
import { HandlerFactory } from '@voiceflow/runtime';

import isPermissionGranted from './utils';

const utilsObj = {
  isPermissionGranted,
};

export const UserInfoHandler: HandlerFactory<Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => 'permissions' in node && !!node.permissions,
  handle: async (node, context, variables) => {
    if (!('permissions' in node)) {
      return node.nextId ?? null;
    }

    let nextId = node.fail_id ?? null;

    if (Array.isArray(node.permissions) && node.permissions.length) {
      const requests = node.permissions.map((p) => utils.isPermissionGranted(p, context, variables));
      const results = await Promise.all(requests);

      if (!results.includes(false)) {
        nextId = node.success_id ?? null;
      }
    } else {
      nextId = node.success_id ?? null;
    }

    return nextId;
  },
});

export default () => UserInfoHandler(utilsObj);
