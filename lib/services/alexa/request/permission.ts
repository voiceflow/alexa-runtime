import { HandlerInput, RequestHandler } from 'ask-sdk';

import { S } from '@/lib/constants';

import { Request } from '../types';
import { updateContext } from '../utils';

const utilsObj = {
  updateContext,
};

export const PermissionHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type.startsWith(Request.SKILL_EVENT_ROOT);
  },
  async handle(input: HandlerInput) {
    const { request } = input.requestEnvelope;

    if (
      (request.type === Request.PERMISSION_ACCEPTED || request.type === Request.PERMISSION_CHANGED) &&
      request.body &&
      Array.isArray(request.body.acceptedPermissions)
    ) {
      const permissions = request.body.acceptedPermissions.reduce((acc: string[], permission) => {
        if (permission.scope) {
          acc.push(permission.scope);
        }

        return acc;
      }, []);

      await utils.updateContext(input, (context) => {
        context.storage.set(S.PERMISSIONS, permissions);
      });
    }

    return input.responseBuilder.getResponse();
  },
});

export default PermissionHandlerGenerator(utilsObj);
