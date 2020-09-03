import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';
import secretsProvider from '@voiceflow/secrets-provider';
import { AxiosInstance } from 'axios';

import { Config } from '@/types';

import { StaticType } from './static';

export type Display = { document?: string };

class ServerDataAPI {
  private client: AxiosInstance;

  constructor(clients: StaticType, config: Config) {
    this.client = clients.axios.create({
      baseURL: config.VF_DATA_ENDPOINT,
      headers: { authorization: `Bearer ${secretsProvider.get('VF_DATA_SECRET')}` },
    });
  }

  public fetchDisplayById = async (displayId: number): Promise<null | Display> => {
    const { data }: { data: undefined | null | Display } = await this.client.get(`/metadata/displays/${displayId}`);

    return data ?? null;
  };

  public getProgram = async (programID: string) => {
    const { data }: { data: AlexaProgram } = await this.client.get(`/diagrams/${programID}`);

    return data;
  };

  public getVersion = async (versionID: string) => {
    const { data }: { data: AlexaVersion } = await this.client.get(`/version/${versionID}`);

    return data;
  };
}

const ServerDataAPIClient = (clients: StaticType, config: Config): ServerDataAPI => new ServerDataAPI(clients, config);

export type ServerDataAPIType = ServerDataAPI;

export default ServerDataAPIClient;
