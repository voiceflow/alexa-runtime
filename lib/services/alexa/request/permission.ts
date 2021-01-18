import { RequestHandler } from 'ask-sdk';

import { S } from '@/lib/constants';

import { AlexaHandlerInput, Request } from '../types';
import { updateRuntime } from '../utils';

const utilsObj = {
  updateRuntime,
};

export const PermissionHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: AlexaHandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type.startsWith(Request.SKILL_EVENT_ROOT);
  },
  async handle(input: AlexaHandlerInput) {
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

      await utils.updateRuntime(input, (runtime) => {
        runtime.storage.set(S.PERMISSIONS, permissions);
      });
    }

    return input.responseBuilder.getResponse();
  },
});

export default PermissionHandlerGenerator(utilsObj);
