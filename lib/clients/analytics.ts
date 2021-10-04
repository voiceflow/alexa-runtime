import { DataAPI, State } from '@voiceflow/general-runtime/build/runtime';
import * as Ingest from '@voiceflow/general-runtime/ingest';
import { Response } from 'ask-sdk-model';

import log from '@/logger';
import { Config } from '@/types';

import { AlexaRuntimeRequest } from '../services/runtime/types';
import { InteractBody, TurnBody } from './ingest-client';
import { AbstractClient } from './utils';

export class AnalyticsSystem extends AbstractClient {
  private ingestClient?: Ingest.Api<InteractBody, TurnBody>;

  constructor(config: Config, public dataAPI: DataAPI) {
    super(config);

    if (config.INGEST_WEBHOOK_ENDPOINT) {
      this.ingestClient = Ingest.Client(config.INGEST_WEBHOOK_ENDPOINT, undefined);
    }
  }

  private createInteractBody({
    eventID,
    request,
    payload,
    turnID,
    timestamp,
  }: {
    eventID: Ingest.Event;
    request: Ingest.RequestType;
    payload: Response | AlexaRuntimeRequest;
    turnID: string;
    timestamp: Date;
  }): InteractBody {
    const isAlexaRuntimeRequest = (p: Response | AlexaRuntimeRequest): p is AlexaRuntimeRequest => (p ? 'type' in p : false);
    return {
      eventId: eventID,
      request: {
        turn_id: turnID,
        type: isAlexaRuntimeRequest(payload) ? payload!.type.toLocaleLowerCase() : request,
        format: request,
        payload,
        timestamp: timestamp.toISOString(),
      },
    } as InteractBody;
  }

  private createTurnBody({
    versionID,
    eventID,
    sessionID,
    metadata,
    timestamp,
  }: {
    versionID: string;
    eventID: Ingest.Event;
    sessionID: string;
    metadata: State;
    timestamp: Date;
  }): TurnBody {
    return {
      eventId: eventID,
      request: {
        session_id: sessionID,
        version_id: versionID,
        state: metadata,
        timestamp: timestamp.toISOString(),
        metadata: {
          locale: metadata.storage.locale,
        },
      },
    } as TurnBody;
  }

  async track({
    id: versionID,
    event,
    request,
    payload,
    sessionid,
    metadata,
    timestamp,
    turnIDP,
  }: {
    id: string;
    event: Ingest.Event;
    request: Ingest.RequestType;
    payload: Response | AlexaRuntimeRequest;
    sessionid: string;
    metadata: State;
    timestamp: Date;
    turnIDP?: string;
  }): Promise<string | null> {
    versionID = await this.dataAPI.unhashVersionID(versionID);
    log.trace(`[analytics] track ${log.vars({ versionID })}`);
    switch (event) {
      case Ingest.Event.TURN: {
        if (sessionid) {
          const turnIngestBody = this.createTurnBody({ versionID, eventID: event, sessionID: sessionid, metadata, timestamp });
          const turnResponse = await this.ingestClient?.doIngest(turnIngestBody);
          const turnID = turnResponse?.data.turn_id!;
          const interactIngestBody = this.createInteractBody({ eventID: Ingest.Event.INTERACT, request, payload, turnID, timestamp });
          await this.ingestClient?.doIngest(interactIngestBody);
          return turnID;
        }
        return null;
      }
      case Ingest.Event.INTERACT: {
        if (turnIDP) {
          const interactIngestBody = this.createInteractBody({ eventID: event, request, payload, turnID: turnIDP, timestamp });

          await this.ingestClient?.doIngest(interactIngestBody);
          return turnIDP;
        }
        return null;
      }
      default:
        throw new RangeError(`Unknown event type: ${event}`);
    }
  }
}

const AnalyticsClient = ({ config, dataAPI }: { config: Config; dataAPI: DataAPI }): AnalyticsSystem => new AnalyticsSystem(config, dataAPI);

export default AnalyticsClient;
