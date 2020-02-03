import { HandlerInput, RequestHandler } from 'ask-sdk';

import { S } from '@/lib/constants';

import { updateContext } from '../utils';

enum REQ_TYPES {
  EVENT_ROOT = 'AlexaSkillEvent.',
  ACCEPTED = 'AlexaSkillEvent.SkillPermissionAccepted',
  CHANGED = 'AlexaSkillEvent.SkillPermissionChanged',
}

const EventHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;
    return type.startsWith(REQ_TYPES.EVENT_ROOT);
  },
  async handle(input: HandlerInput) {
    const { request } = input.requestEnvelope as any;

    if ((request.type === REQ_TYPES.ACCEPTED || request.type === REQ_TYPES.CHANGED) && Array.isArray(request.body?.acceptedPermissions)) {
      const permissions = request.body.acceptedPermissions.reduce((acc: string[], permission: { scope?: string }) => {
        if (permission.scope) acc.push(permission.scope);
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
