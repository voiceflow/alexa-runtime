import secretsProvider from '@voiceflow/secrets-provider';
import { AxiosInstance } from 'axios';

import { Config } from '@/types';

import { StaticType } from './static';

export type Display = { document?: string };

class ServerDataApi {
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
}

const ServerDataApiClient = (clients: StaticType, config: Config): ServerDataApi => new ServerDataApi(clients, config);

export type ServerDataApiType = ServerDataApi;

export default ServerDataApiClient;
