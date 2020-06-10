export interface Input {
  text: string;
  slots: string[];
}

export interface Slot {
  key: string;
  name: string;
  type: {
    value: string;
  };
  inputs: Input[];
}

export interface Intent {
  key: string;
  name: string;
  slots: { id: string; required: boolean }[];
  inputs: Input[];
}

export type SlotConfig = Record<string, any>;

export type IntentConfig = Record<string, SlotConfig>;

export type Fulfillment = Record<string, IntentConfig>;

export interface SkillMetadata {
  creator_id: number;
  restart: boolean;
  resume_prompt: any;
  error_prompt: any;
  diagram: string;
  global: string[];
  repeat: number;
  slots: Slot[];
  fulfillment: Record<string, any>;
  alexa_permissions: string[];
  intents: Intent[];
}

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
