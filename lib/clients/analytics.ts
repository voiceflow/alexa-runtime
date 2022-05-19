import { Api as IngestApi, Client as IngestClient } from '@voiceflow/event-ingestion-service/build/lib/client';
import { Event, IngestableInteraction, IngestableTrace, RequestType } from '@voiceflow/event-ingestion-service/build/lib/types';
import { DataAPI, State } from '@voiceflow/general-runtime/build/runtime';
import { FrameState } from '@voiceflow/general-runtime/build/runtime/lib/Runtime/Stack';
import { Response } from 'ask-sdk-model';

import log from '@/logger';
import { Config } from '@/types';

import { AlexaRuntimeRequest } from '../services/runtime/types';
import { AbstractClient } from './utils';

type InteractionBody = IngestableInteraction<
  {
    stack?: FrameState[];
    storage?: State;
    variables?: State;
    locale?: string;
  },
  Payload
>;

type Payload = Response | AlexaRuntimeRequest | null;

type TraceBody = IngestableTrace<Payload>;

const isAlexaRuntimeRequest = (p: Payload): p is NonNullable<AlexaRuntimeRequest> => (p && 'type' in p) ?? false;
export class AnalyticsSystem extends AbstractClient {
  private ingestClient?: IngestApi<InteractionBody, TraceBody>;

  constructor(config: Config, public dataAPI: DataAPI) {
    super(config);

    if (config.INGEST_WEBHOOK_ENDPOINT) {
      this.ingestClient = IngestClient(config.INGEST_WEBHOOK_ENDPOINT, undefined);
    }
  }

  private createTraceBody({ request, payload }: { request: RequestType; payload: Payload }): TraceBody {
    return {
      type: isAlexaRuntimeRequest(payload) ? payload.type.toLocaleLowerCase() : request,
      payload,
    };
  }

  private createInteractionBody({
    projectID,
    versionID,
    sessionID,
    metadata,
    timestamp,
    actionRequest,
    actionPayload,
    request,
    payload,
  }: {
    projectID: string;
    versionID: string;
    sessionID: string;
    metadata: State;
    timestamp: Date;
    actionRequest: RequestType;
    actionPayload: Payload;
    request: RequestType;
    payload: Payload;
  }): InteractionBody {
    return {
      projectID,
      sessionID,
      versionID,
      startTime: timestamp.toISOString(),
      platform: 'alexa',
      metadata: {
        locale: metadata.storage.locale,
      },
      action: {
        type: actionRequest,
        payload: actionPayload!,
      },
      traces: [this.createTraceBody({ request, payload })],
    };
  }

  async track({
    projectID,
    versionID,
    event,
    actionRequest,
    actionPayload,
    request,
    payload,
    sessionid,
    metadata,
    timestamp,
  }: {
    projectID: string;
    versionID: string;
    event: Event;
    actionRequest: RequestType;
    actionPayload: Payload;
    request: RequestType;
    payload: Payload;
    sessionid?: string;
    metadata: State;
    timestamp: Date;
  }): Promise<string> {
    versionID = await this.dataAPI.unhashVersionID(versionID);
    log.trace(`[analytics] track ${log.vars({ versionID })}`);
    switch (event) {
      case Event.TURN: {
        if (!sessionid) {
          throw new Error('sessionid is required');
        }
<<<<<<< HEAD

        const turnIngestBody = this.createTurnBody({
          versionID,
          eventID: event,
          sessionID: sessionid,
          metadata,
          timestamp,
        });
        const turnResponse = await this.ingestClient?.doIngest(turnIngestBody);

        const turnID = turnResponse?.data.turn_id!;
        const interactIngestBody = this.createInteractBody({
          eventID: Ingest.Event.INTERACT,
          request,
          payload,
          turnID,
          timestamp,
        });

        await this.ingestClient?.doIngest(interactIngestBody);

        return turnID;
      }
      case Ingest.Event.INTERACT: {
        if (!turnIDP) {
          throw new Error('turnIDP is required');
        }

        const interactIngestBody = this.createInteractBody({
          eventID: event,
          request,
          payload,
          turnID: turnIDP,
          timestamp,
        });

        await this.ingestClient?.doIngest(interactIngestBody);

        return turnIDP;
=======
        const interactionBody = this.createInteractionBody({
          projectID,
          versionID,
          sessionID: sessionid,
          metadata,
          timestamp,
          actionRequest,
          actionPayload,
          request,
          payload,
        });
        const interactionResponse = await this.ingestClient?.ingestInteraction(interactionBody);
        return interactionResponse?.data.turnID!;
      }
      case Event.INTERACT: {
        throw new RangeError('INTERACT events are not supported');
>>>>>>> 25ac416 (feat: modify analytics service call to new ingest service (VF-3505))
      }
      default:
        throw new RangeError(`Unknown event type: ${event}`);
    }
  }
}

const AnalyticsClient = ({ config, dataAPI }: { config: Config; dataAPI: DataAPI }): AnalyticsSystem =>
  new AnalyticsSystem(config, dataAPI);

export default AnalyticsClient;
