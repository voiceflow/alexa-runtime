import * as Ingest from '@voiceflow/general-runtime/build/lib/clients/ingest-client';
import { State } from '@voiceflow/general-runtime/build/runtime';
import { FrameState } from '@voiceflow/general-runtime/build/runtime/lib/Runtime/Stack';
import { Response } from 'ask-sdk-model';

import { AlexaRuntimeRequest } from '../services/runtime/types';

export type InteractionBody = Ingest.InteractionBody<
  {
    stack?: FrameState[];
    storage?: State;
    variables?: State;
    locale?: string;
  },
  Payload
>;

export type Payload = Response | AlexaRuntimeRequest | null;

export type TraceBody = Ingest.TraceBody<Payload>;
