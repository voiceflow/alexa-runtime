// @ts-nocheck
import { State } from '@voiceflow/general-runtime/build/runtime';
import { Response } from 'ask-sdk-model';

import log from '@/logger';
import { Config } from '@/types';

import { AlexaRuntimeRequest } from '../services/runtime/types';
import IngestApiClient, { Event, IngestApi, InteractBody, RequestType, TurnBody } from './ingest-client';
import { AbstractClient } from './utils';

export class AnalyticsSystem extends AbstractClient {
  // Rudderstack client is commented due to a possible use in a near future
  // private rudderstackClient?: Rudderstack;

  private ingestClient?: IngestApi;

  // private aggregateAnalytics = false;

  constructor(config: Config) {
    super(config);

    // if (config.ANALYTICS_WRITE_KEY && config.ANALYTICS_ENDPOINT) {
    //   this.rudderstackClient = new Rudderstack(config.ANALYTICS_WRITE_KEY, `${config.ANALYTICS_ENDPOINT}/v1/batch`);
    // }

    if (config.INGEST_WEBHOOK_ENDPOINT) {
      this.ingestClient = IngestApiClient(config.INGEST_WEBHOOK_ENDPOINT, undefined);
    }
    // this.aggregateAnalytics = !config.IS_PRIVATE_CLOUD;
  }

  identify(id: string) {
    log.trace(`[analytics] identify ${log.vars({ id })}`);

    // const payload: IdentifyRequest = {
    //   userId: id,
    // };

    // if (this.aggregateAnalytics && this.rudderstackClient) {
    //   this.rudderstackClient.identify(payload);
    // }
  }

  // private callAnalyticsSystemTrack(id: string, eventId: Event, metadata: InteractBody) {
  //   const interactAnalyticsBody: TrackRequest = {
  //     userId: id,
  //     event: eventId,
  //     properties: {
  //       metadata,
  //     },
  //   };
  //   this.rudderstackClient!.track(interactAnalyticsBody);
  // }

  private createInteractBody({
    eventID,
    request,
    payload,
    turnID,
    timestamp,
  }: {
    eventID: Event;
    request: RequestType;
    payload: Response | AlexaRuntimeRequest;
    turnID: string;
    timestamp: Date;
  }): InteractBody {
    const isAlexaRuntimeRequest = (p: Response | AlexaRuntimeRequest): p is AlexaRuntimeRequest => (p ? 'type' in p : false);
    return {
      eventId: eventID,
      request: {
        turn_id: turnID,
        // eslint-disable-next-line dot-notation
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
    eventID: Event;
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
    event: Event;
    request: RequestType;
    payload: Response | AlexaRuntimeRequest;
    sessionid: string;
    metadata: State;
    timestamp: Date;
    turnIDP?: string;
  }): Promise<string | null> {
    log.trace(`[analytics] track ${log.vars({ versionID })}`);
    switch (event) {
      case Event.TURN: {
        if (sessionid) {
          // TODO: Uncomment to re-enable runtime transcript ingest
          // const turnIngestBody = this.createTurnBody({ versionID, eventID: event, sessionID: sessionid, metadata, timestamp });
          // // User/initial interact
          // // if (this.aggregateAnalytics && this.rudderstackClient) {
          // //   this.callAnalyticsSystemTrack(id, event, turnIngestBody);
          // // }
          // const turnResponse = await this.ingestClient?.doIngest(turnIngestBody);
          // const turnID = turnResponse?.data.turn_id!;
          // const interactIngestBody = this.createInteractBody({ eventID: Event.INTERACT, request, payload, turnID, timestamp });
          // // User/initial interact
          // // if (this.aggregateAnalytics && this.rudderstackClient) {
          // //   this.callAnalyticsSystemTrack(id, event, interactIngestBody);
          // // }
          // await this.ingestClient?.doIngest(interactIngestBody);
          // return turnID;
          return '';
        }
        return null;
      }
      case Event.INTERACT: {
        if (turnIDP) {
          // TODO: Uncomment to re-enable runtime transcript ingest
          // const interactIngestBody = this.createInteractBody({ eventID: event, request, payload, turnID: turnIDP, timestamp });

          // // User/initial interact
          // // if (this.aggregateAnalytics && this.rudderstackClient) {
          // //   this.callAnalyticsSystemTrack(id, event, interactIngestBody);
          // // }

          // await this.ingestClient?.doIngest(interactIngestBody);
          // return turnIDP;
          return '';
        }
        return null;
      }
      default:
        throw new RangeError(`Unknown event type: ${event}`);
    }
  }
}

const AnalyticsClient = (config: Config) => new AnalyticsSystem(config);

export default AnalyticsClient;
