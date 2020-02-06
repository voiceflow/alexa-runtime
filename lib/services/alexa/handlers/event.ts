import { HandlerInput, RequestHandler } from 'ask-sdk';

import { S } from '@/lib/constants';

import { updateContext } from '../utils';

enum Request {
  EVENT_ROOT = 'AlexaSkillEvent.',
  ACCEPTED = 'AlexaSkillEvent.SkillPermissionAccepted',
  CHANGED = 'AlexaSkillEvent.SkillPermissionChanged',
}

const EventHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type.startsWith(Request.EVENT_ROOT);
  },
  async handle(input: HandlerInput) {
    const { request } = input.requestEnvelope;

    if ((request.type === Request.ACCEPTED || request.type === Request.CHANGED) && request.body && Array.isArray(request.body?.acceptedPermissions)) {
      const permissions = request.body.acceptedPermissions.reduce((acc: string[], permission) => {
        if (permission.scope) {
          acc.push(permission.scope);
        }

        return acc;
      }, []);

      await updateContext(input, (context) => {
        context.storage.set(S.PERMISSIONS, permissions);
      });
    }

    return input.responseBuilder.getResponse();
  },
};

export default EventHandler;
