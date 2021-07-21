import { State } from '@voiceflow/general-runtime/build/runtime';
import { FrameState } from '@voiceflow/general-runtime/build/runtime/lib/Runtime/Stack';
import { Response } from 'ask-sdk-model';
import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { AlexaRuntimeRequest } from '../services/runtime/types';

export interface TurnBody {
  eventId: Event;
  request: {
    version_id?: string;
    session_id?: string;
    state?: State;
    timestamp?: string;
    metadata?: {
      stack?: FrameState[];
      storage?: State;
      variables?: State;
    };
  };
}

export interface TurnResponse {
  turn_id: string;
}

export interface InteractBody {
  eventId: Event;
  request: {
    turn_id?: string;
    type?: string;
    format?: string;
    payload?: Response | AlexaRuntimeRequest;
    timestamp?: string;
  };
}

export enum Event {
  INTERACT = 'interact',
  TURN = 'turn',
}

export enum RequestType {
  REQUEST = 'request',
  LAUNCH = 'launch',
  RESPONSE = 'response',
}

export class IngestApi {
  private axios: AxiosInstance;

  public constructor(endpoint: string, authorization?: string) {
    const config: AxiosRequestConfig = {
      baseURL: endpoint,
    };

    if (authorization) {
      config.headers = {
        Authorization: authorization,
      };
    }

    this.axios = Axios.create(config);
  }

  public doIngest = async (body: InteractBody) => this.axios.post<TurnResponse>('/v1/ingest', body);
}

const IngestClient = (endpoint: string, authorization: string | undefined) => new IngestApi(endpoint, authorization);

export default IngestClient;
