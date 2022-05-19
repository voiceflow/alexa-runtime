import { Event, RequestType } from '@voiceflow/event-ingestion-service/build/lib/types';
import { expect } from 'chai';
import sinon from 'sinon';

import AnalyticsClient from '@/lib/clients/analytics';

describe('Analytics client unit tests', () => {
  describe('Track', () => {
    it('throws on unknown events', () => {
      const client = AnalyticsClient({
        config: {},
        dataAPI: { unhashVersionID: sinon.stub().returns('versionID') },
      } as any);
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

      expect(
        client.track({
          projectID: 'projectID',
          versionID: 'versionID',
          event: 'Unknow event' as Event,
          actionRequest: RequestType.REQUEST,
          actionPayload: payload as any,
          request: RequestType.REQUEST,
          payload: payload as any,
          sessionid: 'session.id',
          metadata: metadata as any,
          timestamp: new Date(),
        })
      ).to.eventually.rejectedWith(RangeError);
    });
  });
});
