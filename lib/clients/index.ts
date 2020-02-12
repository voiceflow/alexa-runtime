import { Config } from '@/types';

import Dynamo, { DynamoType } from './dynamo';
import Multimodal, { MultimodalType } from './multimodal';
import ServerDataApi, { ServerDataApiType } from './serverDataApi';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
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

  return {
    ...Static,
    dynamo,
    serverDataApi,
    multimodal,
  };
};

export default buildClients;
