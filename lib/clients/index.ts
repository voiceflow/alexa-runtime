import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';
import { DataAPI, LocalDataApi, ServerDataApi } from '@voiceflow/runtime';

import MongoPersistenceAdapter from '@/lib/services/alexa/mongo';
import { Config } from '@/types';

import Dynamo, { DynamoType } from './dynamo';
import Metrics, { MetricsType } from './metrics';
import MongoDB from './mongodb';
import Multimodal, { MultimodalType } from './multimodal';
import PrototypeServerDataApi from './prototypeServerDataApi';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
  multimodal: MultimodalType;
  dataAPI: DataAPI<AlexaProgram, AlexaVersion>;
  metrics: MetricsType;
  mongo: MongoDB | null;
  prototypeDataAPI: DataAPI<AlexaProgram, AlexaVersion>;
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dynamo = Dynamo(config);
  const dataAPI = config.PROJECT_SOURCE
    ? new LocalDataApi({ projectSource: config.PROJECT_SOURCE }, { fs: Static.fs, path: Static.path })
    : new ServerDataApi(
        { platform: 'alexa', adminToken: config.ADMIN_SERVER_DATA_API_TOKEN, dataEndpoint: config.VF_DATA_ENDPOINT },
        { axios: Static.axios }
      );
  const multimodal = Multimodal(dataAPI);
  const metrics = Metrics(config);
  const mongo = MongoPersistenceAdapter.enabled(config) ? new MongoDB(config) : null;

  // TODO: remove after general assistant implements prototype
  const prototypeDataAPI = config.PROJECT_SOURCE
    ? dataAPI
    : new PrototypeServerDataApi(
        { platform: 'alexa', adminToken: config.ADMIN_SERVER_DATA_API_TOKEN, dataEndpoint: config.VF_DATA_ENDPOINT },
        { axios: Static.axios }
      );

  return {
    ...Static,
    dynamo,
    multimodal,
    dataAPI,
    metrics,
    mongo,
    prototypeDataAPI,
  };
};

export const initClients = async (_config: Config, clients: ClientMap) => {
  await clients.dataAPI.init();
  await clients.prototypeDataAPI.init();
  await clients.mongo?.start();
};

export const stopClients = async (_config: Config, clients: ClientMap) => {
  await clients.mongo?.stop();
};

export default buildClients;
