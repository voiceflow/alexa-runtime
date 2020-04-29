import { Config } from '@/types';

import Dynamo, { DynamoType } from './dynamo';
import Hashids, { HashidsType } from './hashids';
import Metrics, { MetricsType } from './metrics';
import Multimodal, { MultimodalType } from './multimodal';
import ServerDataApi, { ServerDataApiType } from './serverDataApi';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
  multimodal: MultimodalType;
  serverDataApi: ServerDataApiType;
  metrics: MetricsType;
  hashids: HashidsType;
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dynamo = Dynamo(config);
  const serverDataApi = ServerDataApi(Static, config);
  const multimodal = Multimodal(serverDataApi);
  const metrics = Metrics(config);
  const hashids = Hashids();

  return {
    ...Static,
    dynamo,
    multimodal,
    serverDataApi,
    metrics,
    hashids,
  };
};

export default buildClients;
