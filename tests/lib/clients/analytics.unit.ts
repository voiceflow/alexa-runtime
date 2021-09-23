import { expect } from 'chai';
import sinon from 'sinon';

import AnalyticsClient from '@/lib/clients/analytics';
import { Event, RequestType } from '@/lib/clients/ingest-client';

describe('Analytics client unit tests', () => {
  // describe('Identify', () => {
  //   it('works', () => {
  //     const config = {};
  //     const rudderstack = { identify: sinon.stub() };
  //     const client = AnalyticsClient(config as any);
  //     (client as any).rudderstackClient = rudderstack;
  //     client.identify('user id');
  //     expect(rudderstack.identify.callCount).to.eql(1);
  //     expect(rudderstack.identify.getCall(0).args).to.deep.eq([{ userId: 'user id' }]);
  //   });
  // });
  // describe('Track', () => {
  //   it('throws on unknown events', () => {
  //     const client = AnalyticsClient({ config: {} } as any);
  //     const metadata = {
  //       data: {
  //         reqHeaders: {},
  //         locale: 'locale',
  //       },
  //       stack: {},
  //       storage: {},w
  //       variables: {},
  //     };
  //     const payload = {};
  //     expect(
  //       client.track({
  //         id: 'id',
  //         event: 'Unknow event' as Event,
  //         request: RequestType.REQUEST,
  //         payload: payload as any,
  //         sessionid: 'session.id',
  //         metadata: metadata as any,
  //         timestamp: new Date(),
  //       })
  //     ).to.eventually.rejectedWith(RangeError);
  //   });
  //   // it('works with interact events', () => {
  //   //   const config = {
  //   //     ANALYTICS_WRITE_KEY: 'write key',
  //   //     ANALYTICS_ENDPOINT: 'http://localhost/analytics',
  //   //     INGEST_WEBHOOK_ENDPOINT: 'http://localhost/ingest',
  //   //   };
  //   //   const metadata = {
  //   //     data: {
  //   //       reqHeaders: {},
  //   //       locale: 'locale',
  //   //     },
  //   //     stack: {},
  //   //     storage: {},
  //   //     variables: {},
  //   //   };
  //   //   const payload = {};
  //   //   const rudderstack = { track: sinon.stub() };
  //   //   const client = AnalyticsClient(config as any);
  //   //   (client as any).rudderstackClient = rudderstack;
  //   //   const ingestClient = { doIngest: sinon.stub() };
  //   //   (client as any).ingestClient = ingestClient;
  //   //   const timestamp = new Date();
  //   //   client.track({
  //   //     id: 'id',
  //   //     event: Event.INTERACT,
  //   //     request: RequestType.REQUEST,
  //   //     payload: payload as any,
  //   //     sessionid: 'session.id',
  //   //     metadata: metadata as any,
  //   //     timestamp,
  //   //   });
  //   //   expect(rudderstack.track.callCount).to.eql(1);
  //   //   expect(rudderstack.track.getCall(0).args).to.deep.eq([
  //   //     {
  //   //       userId: 'id',
  //   //       event: Event.INTERACT,
  //   //       properties: {
  //   //         metadata: {
  //   //           eventId: Event.INTERACT,
  //   //           request: {
  //   //             type: RequestType.REQUEST,
  //   //             payload: {},
  //   //             format: 'request',
  //   //             turn_id: undefined,
  //   //             timestamp: timestamp.toISOString(),
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //   ]);
  //   // });
  // });
});
