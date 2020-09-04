import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';

export type Display = { document?: string };

export interface DataAPI {
  fetchDisplayById(displayId: number): Promise<null | Display>;

  getProgram(programID: string): Promise<AlexaProgram>;

  getTestProgram(programID: string): Promise<AlexaProgram>;

  getVersion(versionID: string): Promise<AlexaVersion>;
}
