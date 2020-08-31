export interface Audio {
  url: string;
  title?: string;
  description?: string;
  icon?: string;
  background?: string;
  offset: number;
}

export enum Request {
  INTENT = 'IntentRequest',
  SKILL_EVENT_ROOT = 'AlexaSkillEvent.',
  PERMISSION_ACCEPTED = 'AlexaSkillEvent.SkillPermissionAccepted',
  PERMISSION_CHANGED = 'AlexaSkillEvent.SkillPermissionChanged',
}
