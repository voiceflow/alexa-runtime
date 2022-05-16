import * as Ingest from '@voiceflow/general-runtime/build/lib/clients/ingest-client';
import { DataAPI, State } from '@voiceflow/general-runtime/build/runtime';

import log from '@/logger';
import { Config } from '@/types';

import { AlexaRuntimeRequest } from '../services/runtime/types';
import { InteractionBody, Payload, TraceBody } from './ingest-client';
import { AbstractClient } from './utils';

const isAlexaRuntimeRequest = (p: Payload): p is NonNullable<AlexaRuntimeRequest> => (p ? 'type' in p : false);
export class AnalyticsSystem extends AbstractClient {
  private ingestClient?: Ingest.Api<InteractionBody, TraceBody>;

  constructor(config: Config, public dataAPI: DataAPI) {
    super(config);

    if (config.INGEST_WEBHOOK_ENDPOINT) {
      this.ingestClient = Ingest.Client(config.INGEST_WEBHOOK_ENDPOINT, undefined);
    }
  }

  private createTraceBody({ request, payload, timestamp }: { request: Ingest.RequestType; payload: Payload; timestamp: Date }): TraceBody {
    return {
      type: isAlexaRuntimeRequest(payload) ? payload.type.toLocaleLowerCase() : request,
      format: request,
      payload,
      startTime: timestamp.toISOString(),
    };
  }

  private createInteractionBody({
    projectID,
    versionID,
    sessionID,
    metadata,
    timestamp,
    initialRequest,
    initialPayload,
    request,
    payload,
  }: {
    projectID: string;
    versionID: string;
    sessionID: string;
    metadata: State;
    timestamp: Date;
    initialRequest: Ingest.RequestType;
    initialPayload: Payload;
    request: Ingest.RequestType;
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
      traces: [
        this.createTraceBody({ request: initialRequest, payload: initialPayload, timestamp }),
        this.createTraceBody({ request, payload, timestamp }),
      ],
    };
  }

  async track({
    projectID,
    versionID,
    event,
    initialRequest,
    initialPayload,
    request,
    payload,
    sessionid,
    metadata,
    timestamp,
  }: {
    projectID: string;
    versionID: string;
    event: Ingest.Event;
    initialRequest: Ingest.RequestType;
    initialPayload: Payload;
    request: Ingest.RequestType;
    payload: Payload;
    sessionid?: string;
    metadata: State;
    timestamp: Date;
  }): Promise<string> {
    versionID = await this.dataAPI.unhashVersionID(versionID);
    log.trace(`[analytics] track ${log.vars({ versionID })}`);
    switch (event) {
      case Ingest.Event.TURN: {
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
          initialRequest,
          initialPayload,
          request,
          payload,
        });
        const interactionResponse = await this.ingestClient?.ingestInteraction(interactionBody);
        return interactionResponse?.data.turnID!;
      }
      case Ingest.Event.INTERACT: {
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
