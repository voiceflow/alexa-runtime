import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';
import { DataAPI, LocalDataApi, MongoDataAPI } from '@voiceflow/general-runtime/build/runtime';
import { SkillRequestSignatureVerifier, TimestampVerifier, Verifier } from 'ask-sdk-express-adapter';

import PostgresPersistenceAdapter from '@/lib/services/alexa/postgres';
import { Config } from '@/types';

import Analytics, { AnalyticsSystem } from './analytics';
import Dynamo, { DynamoType } from './dynamo';
import Metrics, { MetricsType } from './metrics';
import MongoDB from './mongodb';
import Multimodal from './multimodal';
import PostgresDB from './postgres';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dynamo: DynamoType;
  multimodal: Multimodal;
  dataAPI: DataAPI<AlexaProgram.Program, AlexaVersion.Version>;
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
  // TODO: remove dynamo
  const dynamo = Dynamo(config);
  const mongo = new MongoDB(config);

  const dataAPI = config.PROJECT_SOURCE
    ? new LocalDataApi<AlexaProgram.Program, AlexaVersion.Version>(
        { projectSource: config.PROJECT_SOURCE },
        { fs: Static.fs, path: Static.path }
      )
    : new MongoDataAPI<AlexaProgram.Program, AlexaVersion.Version>(mongo);

  const multimodal = new Multimodal();
  const metrics = Metrics(config);
  const pg = PostgresPersistenceAdapter.enabled(config) ? new PostgresDB(config) : null;
  const analyticsClient = Analytics({ config, dataAPI });
  const alexaVerifiers = [new SkillRequestSignatureVerifier(), new TimestampVerifier()];

  return {
    ...Static,
    pg,
    mongo,
    dynamo,
    dataAPI,
    metrics,
    multimodal,
    alexaVerifiers,
    analyticsClient,
  };
};

export const initClients = async (_config: Config, clients: ClientMap) => {
  await clients.mongo?.start();
  await clients.pg?.start();
};

export const stopClients = async (_config: Config, clients: ClientMap) => {
  await clients.mongo?.stop();
  await clients.pg?.stop();
  await clients.metrics?.stop();
};

export default buildClients;
