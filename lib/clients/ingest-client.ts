import { State } from '@voiceflow/general-runtime/build/runtime';
import { FrameState } from '@voiceflow/general-runtime/build/runtime/lib/Runtime/Stack';
import { Response } from 'ask-sdk-model';
import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { AlexaRuntimeRequest } from '../services/runtime/types';

export interface InteractBody {
  eventId: Event;
  request: {
    requestType?: string;
    sessionId?: string;
    versionId?: string;
    payload?: Response | AlexaRuntimeRequest;
    metadata?: {
      stack?: FrameState[];
      storage?: State;
      variables?: State;
    };
  };
}

export enum Event {
  INTERACT = 'interact',
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

  public doIngest = async (body: InteractBody) => this.axios.post('/v1/ingest', body);
}

const IngestClient = (endpoint: string, authorization: string | undefined) => new IngestApi(endpoint, authorization);

export default IngestClient;
