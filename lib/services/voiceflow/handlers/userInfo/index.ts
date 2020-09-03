import { NodeType } from '@voiceflow/alexa-types';
import { Node } from '@voiceflow/api-sdk';
import { HandlerFactory } from '@voiceflow/client';

import { Permission } from './constants';
import isPermissionGranted from './utils';

export type UserInfoNode = Node<
  NodeType.USER_INFO,
  {
    fail_id?: string;
    success_id?: string;
    permissions?: Permission[];
  }
>;

const utilsObj = {
  isPermissionGranted,
};

export const UserInfoHandler: HandlerFactory<UserInfoNode, typeof utilsObj> = (utils) => ({
  canHandle: (node) => {
    return !!node.permissions;
  },
  handle: async (node, context, variables) => {
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
