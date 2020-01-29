import { HandlerInput, RequestHandler } from 'ask-sdk';

import { S } from '@/lib/constants';

const EventHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type.startsWith('AlexaSkillEvent.');
  },
  async handle(input: HandlerInput) {
    const { request } = input.requestEnvelope;

    if (
      (request.type === 'AlexaSkillEvent.SkillPermissionAccepted' || request.type === 'AlexaSkillEvent.SkillPermissionChanged') &&
      Array.isArray(request.body.acceptedPermissions)
    ) {
      const rawState = await input.attributesManager.getPersistentAttributes();
      rawState.storage = {
        ...rawState.storage,
        [S.PERMISSIONS]: request.body.acceptedPermissions.reduce((acc, permission) => {
          if (permission.scope) acc.push(permission.scope);
          return acc;
        }, []),
      };
      input.attributesManager.setPersistentAttributes(rawState);
    }

    return input.responseBuilder.getResponse();
  },
};

export default EventHandler;
