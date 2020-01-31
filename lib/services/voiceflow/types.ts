import { Context as VContext, Handler as VHandler, Request } from '@voiceflow/client';
import { Intent } from 'ask-sdk-model';

export type Mapping = { variable: string; slot: string };

export type Block = { [key: string]: any };

export type Context = VContext<Block>;

export type Handler = VHandler<Block>;

export type Choice = {
  mappings: Array<Mapping>;
  intent: string;
  nextIdIndex?: number;
};

export enum RequestType {
  INTENT = 'INTENT',
}

export interface IntentRequestPayload {
  intent: Intent;
}

export interface IntentRequest extends Request {
  type: RequestType.INTENT;
  payload: IntentRequestPayload;
}
