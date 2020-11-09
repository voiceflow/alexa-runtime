import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';
import { DataAPI, LocalDataApi, ServerDataApi } from '@voiceflow/runtime';

import { Config } from '@/types';

import Dynamo, { DynamoType } from './dynamo';
import Metrics, { MetricsType } from './metrics';
import Multimodal, { MultimodalType } from './multimodal';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
  multimodal: MultimodalType;
  dataAPI: DataAPI<AlexaProgram, AlexaVersion>;
  metrics: MetricsType;
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dynamo = Dynamo(config);
  const dataAPI = config.PROJECT_SOURCE
    ? new LocalDataApi({ projectSource: config.PROJECT_SOURCE }, { fs: Static.fs, path: Static.path })
    : new ServerDataApi({ dataSecret: config.VF_DATA_SECRET, dataEndpoint: config.VF_DATA_ENDPOINT }, { axios: Static.axios });
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

export const initClients = async (clients: ClientMap) => {
  await clients.dataAPI.init();
};

export default buildClients;
