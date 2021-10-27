import { EmptyObject } from '@voiceflow/common';
import * as Express from 'express';
import * as ExpressValidator from 'express-validator';

export interface Config {
  NODE_ENV: string;
  PORT: string;
  PORT_METRICS: string | null;
  CLOUD_ENV: string | null;
  IS_PRIVATE_CLOUD: boolean;
  ERROR_RESPONSE_MS: number;
  /** Censor certain sensitive info (ex. API access tokens) */
  PRIVATE_LOGS: boolean;

  AWS_ACCESS_KEY_ID: string | null;
  AWS_SECRET_ACCESS_KEY: string | null;
  AWS_REGION: string | null;
  AWS_ENDPOINT: string | null;

  // Application secrets
  DATADOG_API_KEY: string;
  ADMIN_SERVER_DATA_API_TOKEN: string;

  DYNAMO_ENDPOINT: string | null;
  CODE_HANDLER_ENDPOINT: string | null;
  INTEGRATIONS_HANDLER_ENDPOINT: string;
  API_HANDLER_ENDPOINT: string | null;

  // Release information
  GIT_SHA: string | null;
  BUILD_NUM: string | null;
  SEM_VER: string | null;
  BUILD_URL: string | null;

  SESSIONS_DYNAMO_TABLE: string;

  VF_DATA_ENDPOINT: string;
  // Logging
  LOG_LEVEL: string | null;
  MIDDLEWARE_VERBOSITY: string | null;

  PROJECT_SOURCE: string | null;
  SESSIONS_SOURCE: string | null;

  MONGO_URI: string | null;
  MONGO_DB: string | null;

  // postgres
  PG_USERNAME: string | null;
  PG_HOST: string | null;
  PG_DBNAME: string | null;
  PG_PASSWORD: string | null;
  PG_PORT: string | null;

  CONFIG_ID_HASH: string | null;

  // Analytics
  ANALYTICS_ENDPOINT: string | null;
  ANALYTICS_WRITE_KEY: string | null;
  INGEST_WEBHOOK_ENDPOINT: string | null;
}

export interface Request<P extends Record<string, any> = EmptyObject> extends Express.Request<P> {
  headers: Record<string, string>;
  platform?: string;
  // timedout?: boolean;
}

export type Response = Express.Response;

export type Next = () => void;

export interface Route<P = EmptyObject, T = void> {
  (req: Request<P>): Promise<T>;

  validations?: ExpressValidator.ValidationChain[];
  callback?: boolean;
  route?: unknown;
}

export type Controller = Record<string, Route>;

export type Middleware = (req: Request, res: Response, next: Next) => Promise<void>;

export type MiddlewareGroup = Record<string, Middleware>;

export interface Class<T, A extends any[]> {
  new (...args: A): T;
}
export type AnyClass = Class<any, any[]>;
