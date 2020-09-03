import { Config } from '@/types';

import Dynamo, { DynamoType } from './dynamo';
import Metrics, { MetricsType } from './metrics';
import Multimodal, { MultimodalType } from './multimodal';
import ServerDataAPI, { ServerDataAPIType } from './serverDataAPI';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
  multimodal: MultimodalType;
  serverDataAPI: ServerDataAPIType;
  metrics: MetricsType;
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dynamo = Dynamo(config);
  const serverDataAPI = ServerDataAPI(Static, config);
  const multimodal = Multimodal(serverDataAPI);
  const metrics = Metrics(config);

  return {
    ...Static,
    dynamo,
    multimodal,
    serverDataAPI,
    metrics,
  };
};

export default buildClients;
