import { Program, Version } from '@voiceflow/alexa-types';
import { DataAPI, LocalDataApi, ServerDataApi } from '@voiceflow/general-runtime/build/runtime';
import { Constants } from '@voiceflow/general-types';
import { SkillRequestSignatureVerifier, TimestampVerifier, Verifier } from 'ask-sdk-express-adapter';

import MongoPersistenceAdapter from '@/lib/services/alexa/mongo';
import PostgresPersistenceAdapter from '@/lib/services/alexa/postgres';
import { Config } from '@/types';

import Analytics, { AnalyticsSystem } from './analytics';
import Dynamo, { DynamoType } from './dynamo';
import Metrics, { MetricsType } from './metrics';
import MongoDB from './mongodb';
import Multimodal, { MultimodalType } from './multimodal';
import PostgresDB from './postgres';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
  multimodal: MultimodalType;
  dataAPI: DataAPI<Program.AlexaProgram, Version.AlexaVersion>;
  metrics: MetricsType;
  mongo: MongoDB | null;
  pg: PostgresDB | null;
  analyticsClient: AnalyticsSystem;
  alexaVerifiers: Verifier[];
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dynamo = Dynamo(config);
  const dataAPI = config.PROJECT_SOURCE
    ? new LocalDataApi<Program.AlexaProgram, Version.AlexaVersion>({ projectSource: config.PROJECT_SOURCE }, { fs: Static.fs, path: Static.path })
    : new ServerDataApi<Program.AlexaProgram, Version.AlexaVersion>(
        { platform: Constants.PlatformType.ALEXA, adminToken: config.ADMIN_SERVER_DATA_API_TOKEN, dataEndpoint: config.VF_DATA_ENDPOINT },
        { axios: Static.axios }
      );
  const multimodal = Multimodal(dataAPI);
  const metrics = Metrics(config);
  const mongo = MongoPersistenceAdapter.enabled(config) ? new MongoDB(config) : null;
  const pg = PostgresPersistenceAdapter.enabled(config) ? new PostgresDB(config) : null;
  const analyticsClient = Analytics({ config, dataAPI });
  const alexaVerifiers = [new SkillRequestSignatureVerifier(), new TimestampVerifier()];

  return {
    ...Static,
    mongo,
    pg,
    dynamo,
    dataAPI,
    metrics,
    multimodal,
    alexaVerifiers,
    analyticsClient,
  };
};

export const initClients = async (_config: Config, clients: ClientMap) => {
  await clients.dataAPI.init();
  await clients.mongo?.start();
  await clients.pg?.start();
};

export const stopClients = async (_config: Config, clients: ClientMap) => {
  await clients.mongo?.stop();
  await clients.pg?.stop();
  await clients.metrics?.stop();
};

export default buildClients;
