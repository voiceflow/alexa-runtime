import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';

import { Config } from '@/types';

import { StaticType } from '../static';
import { DataAPI } from './types';

class LocalDataAPI implements DataAPI {
  private version: AlexaVersion;

  private programs: Record<string, AlexaProgram>;

  constructor(clients: StaticType, config: Config) {
    if (!config.PROJECT_SOURCE) throw new Error('project source undefined');

    const content = JSON.parse(clients.fs.readFileSync(config.PROJECT_SOURCE, 'utf8'));
    this.version = content.version;
    this.programs = content.programs;
  }

  public getVersion = async () => this.version;

  public getProgram = async (programID: string) => this.programs[programID];

  public getTestProgram = async () => {
    throw new Error('local implementation does not support tests');
  };

  public fetchDisplayById = async () => null;
}

export default LocalDataAPI;
