import * as Ingest from '@voiceflow/general-runtime/build/lib/clients/ingest-client';
import { State } from '@voiceflow/general-runtime/build/runtime';
import { FrameState } from '@voiceflow/general-runtime/build/runtime/lib/Runtime/Stack';
import { Response } from 'ask-sdk-model';

import { AlexaRuntimeRequest } from '../services/runtime/types';

export type TurnBody = Ingest.TurnBody<{
  stack?: FrameState[];
  storage?: State;
  variables?: State;
}>;

export type InteractBody = Ingest.InteractBody<Response | AlexaRuntimeRequest>;
