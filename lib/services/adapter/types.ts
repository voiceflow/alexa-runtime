import { interfaces, SupportedInterfaces } from 'ask-sdk-model';

import { Command as DisplayCommand, DisplayInfo } from '../runtime/handlers/display/types';
import { StreamAction, StreamPlay } from '../runtime/handlers/stream';

export interface OldCommands {
  [key: string]: {
    mappings: Array<{ variable: string; slot: string }>;
    diagram_id: string; // when command
    end: boolean; // when command
    next: string; // when intent
  };
}

interface OldPlay {
  action: StreamAction;
  url: string;
  loop: boolean;
  offset: number;
  nextId: string;
  token: string;
  PAUSE_ID: string;
  NEXT: string;
  PREVIOUS: string;
  title: string;
  description: string;
  regex_title: string;
  regex_description: string;
  icon_img: string;
  background_img: string;
}

type OldRandoms = Record<string, string[]>;

type OldGlobals = [
  {
    [key: string]: any;
    voiceflow: { [key: string]: any; events: any[]; permissions: string[]; capabilities: SupportedInterfaces; context: any[] };
  }
];

type OldDiagrams = Array<{
  line: string | false;
  id: string;
  variable_state: Record<string, any>;
  output_map?: Array<[string, string]>;
  commands: OldCommands;
  speak: string;
}>;

export interface OldStateRaw {
  line_id: string | null;
  output: string;
  last_speak?: string;
  sessions: number;
  repeat: number;
  locale: string;
  user: string;
  alexa_permissions: string[];
  supported_interfaces: SupportedInterfaces;
  randoms?: OldRandoms;
  permissions?: string[];
  payment?: {
    productId: string;
    success: string;
    fail: string;
    result?: string;
  };
  cancel_payment?: {
    productId: string;
    success: string;
    fail: string;
    result?: string;
  };
  display_info?: {
    playing_videos: Record<string, { started: number }>;
    datasource?: string;
    commands?: DisplayCommand[];
    should_update?: boolean;
    current_display?: number;
    last_datasource?: string;
    datasource_variables?: string[];
    should_update_on_resume?: boolean;
    // no lastVariables in old server. can get this from variables -> handled in afterStorageModifier
  };
  play?: OldPlay;
  pause?: {
    id: string;
    offset: number;
  };
  finished?: true;
  // stream play temp vars -> handled in beforeContextModifier
  next_play?: OldPlay;
  next_line?: string;
  temp?: {
    diagrams: OldDiagrams;
    globals: OldGlobals;
    randoms?: OldRandoms;
  };
  // end of play temp vars
  globals: OldGlobals;
  diagrams: OldDiagrams;
}

export interface Command {
  diagram_id?: string; // when command
  next?: string; // when intent
  mappings: Array<{ variable: string; slot: string }>;
  end?: boolean; // when command
  intent: string;
}
export type Commands = Array<Command>;

export interface Frame {
  nodeID: string | null;
  programID: string;
  variables: Record<string, any>;
  storage: {
    [key: string]: any;
    outputMap?: Array<[string, string]>;
    speak?: string;
    calledCommand?: boolean;
  };
  commands: Commands;
}

export type NewStateStack = Array<Frame>;

export interface NewStateStorage {
  output: string;
  sessions: number;
  repeat: number;
  locale: string;
  user: string;
  alexa_permissions: string[];
  supported_interfaces: SupportedInterfaces;
  accessToken?: string | undefined;
  randoms?: Record<string, string[]>;
  permissions?: string[];
  payment?: {
    productId: string;
    successPath: string;
    failPath: string;
    status: string | null;
  };
  cancelPayment?: {
    productId: string;
    successPath: string;
    failPath: string;
    status: string | null;
  };
  displayInfo?: DisplayInfo;
  streamPlay?: StreamPlay;
  streamPause?: {
    id: string;
    offset: number;
  };
  streamFinished?: true;
  streamTemp?: NewStateRaw;
}

export interface NewVoiceflowVars {
  [key: string]: any;
  permissions: string[]; // alexa_permissions
  events: any[];
  capabilities: SupportedInterfaces; // supported_interfaces
}

export interface NewStateVariables {
  [key: string]: any;
  voiceflow: NewVoiceflowVars;
  _context: interfaces.system.ViewportState
  _system: interfaces.system.SystemState;
}

export interface NewStateRaw {
  stack: NewStateStack;
  storage: NewStateStorage;
  variables: NewStateVariables;
}
