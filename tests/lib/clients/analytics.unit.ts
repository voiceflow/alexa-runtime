import { expect } from 'chai';
import sinon from 'sinon';

import AnalyticsClient from '@/lib/clients/analytics';
import { Event } from '@/lib/clients/ingest-client';

describe('Analytics client unit tests', () => {
  describe('Identify', () => {
    it('works', () => {
      const config = {};

      const rudderstack = { identify: sinon.stub() };

      const client = AnalyticsClient(config as any);

      (client as any).rudderstackClient = rudderstack;

      client.identify('user id');

      expect(rudderstack.identify.callCount).to.eql(1);
      expect(rudderstack.identify.getCall(0).args).to.deep.eq([{ userId: 'user id' }]);
    });
  });

  describe('Track', () => {
    it('throws on unknown events', () => {
      const client = AnalyticsClient({} as any);

      expect(client.track('id', 'unknown event' as any, {} as any)).to.eventually.rejectedWith(RangeError);
    });

    it('works with interact events', () => {
      const config = {
        ANALYTICS_WRITE_KEY: 'write key',
        ANALYTICS_ENDPOINT: 'http://localhost/analytics',
        INGEST_WEBHOOK_ENDPOINT: 'http://localhost/ingest',
      };

      const metadata = {
        data: {
          reqHeaders: {},
          locale: 'locale',
        },
        stack: {},
        storage: {},
        variables: {},
      };

      const payload = {};

      const rudderstack = { track: sinon.stub() };

      const client = AnalyticsClient(config as any);

      (client as any).rudderstackClient = rudderstack;

      const ingestClient = { doIngest: sinon.stub() };

      (client as any).ingestClient = ingestClient;

      client.track('id', Event.INTERACT, true, payload as any, 'session.id', metadata as any);

      expect(rudderstack.track.callCount).to.eql(1);
      expect(rudderstack.track.getCall(0).args).to.deep.eq([
        {
          userId: 'id',
          event: Event.INTERACT,
          properties: {
            metadata: {
              eventId: Event.INTERACT,
              request: {
                metadata: {
                  variables: {},
                  storage: {},
                  stack: {},
                },
                payload: {},
                requestType: 'request',
                sessionId: 'session.id',
                versionId: 'id',
              },
            },
          },
        },
      ]);
    });
  });
});
