import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';
import { DataAPI, LocalDataApi, ServerDataApi } from '@voiceflow/runtime';

import MongoPersistenceAdapter from '@/lib/services/alexa/mongo';
import { Config } from '@/types';

import Dynamo, { DynamoType } from './dynamo';
import Metrics, { MetricsType } from './metrics';
import MongoDB from './mongodb';
import Multimodal, { MultimodalType } from './multimodal';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
  multimodal: MultimodalType;
  dataAPI: DataAPI<AlexaProgram, AlexaVersion>;
  metrics: MetricsType;
  mongo: MongoDB | null;
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dynamo = Dynamo(config);
  const dataAPI = config.PROJECT_SOURCE
    ? new LocalDataApi({ projectSource: config.PROJECT_SOURCE }, { fs: Static.fs, path: Static.path })
    : new ServerDataApi({ adminToken: config.ADMIN_SERVER_DATA_API_TOKEN, dataEndpoint: config.VF_DATA_ENDPOINT }, { axios: Static.axios });
  const multimodal = Multimodal(dataAPI);
  const metrics = Metrics(config);
  const mongo = MongoPersistenceAdapter.enabled(config) ? new MongoDB(config) : null;

  return {
    ...Static,
    dynamo,
    multimodal,
    dataAPI,
    metrics,
    mongo,
  };
};

export const initClients = async (config: Config, clients: ClientMap) => {
  await clients.dataAPI.init();
  if (MongoPersistenceAdapter.enabled(config)) await clients.mongo!.start();
};

export const stopClients = async (config: Config, clients: ClientMap) => {
  if (MongoPersistenceAdapter.enabled(config)) await clients.mongo!.stop();
};

export default buildClients;
