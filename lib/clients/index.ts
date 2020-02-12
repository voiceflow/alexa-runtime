import Hashids from 'hashids';

import { Config } from '@/types';

import Dynamo, { DynamoType } from './dynamo';
import Multimodal, { MultimodalType } from './multimodal';
import ServerDataApi, { ServerDataApiType } from './serverDataApi';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
  hashids: Hashids;
  multimodal: MultimodalType;
  serverDataApi: ServerDataApiType;
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dynamo = Dynamo(config);
  const serverDataApi = ServerDataApi(config);
  const multimodal = Multimodal(serverDataApi);
  const hashids = new Hashids(config.CONFIG_ID_HASH, 10);

  return {
    ...Static,
    dynamo,
    hashids,
    multimodal,
    serverDataApi,
  };
};

export default buildClients;
