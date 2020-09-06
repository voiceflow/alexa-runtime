import { Config } from '@/types';

import LocalDataAPI from './data/localDataAPI';
import ServerDataAPI from './data/serverDataAPI';
import { DataAPI } from './data/types';
import Dynamo, { DynamoType } from './dynamo';
import Metrics, { MetricsType } from './metrics';
import Multimodal, { MultimodalType } from './multimodal';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
  multimodal: MultimodalType;
  dataAPI: DataAPI;
  metrics: MetricsType;
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dynamo = Dynamo(config);
  const dataAPI = config.PROJECT_SOURCE ? new LocalDataAPI(Static, config) : new ServerDataAPI(Static, config);
  const multimodal = Multimodal(dataAPI);
  const metrics = Metrics(config);

  return {
    ...Static,
    dynamo,
    multimodal,
    dataAPI,
    metrics,
  };
};

export default buildClients;
