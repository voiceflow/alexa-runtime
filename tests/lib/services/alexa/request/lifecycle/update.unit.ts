import { expect } from 'chai';
import sinon from 'sinon';

import { Event, RequestType } from '@/lib/clients/ingest-client';
import { T, V } from '@/lib/constants';
import update from '@/lib/services/alexa/request/lifecycle/update';

describe('update lifecycle unit tests', () => {
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers(Date.now()); // fake Date.now
  });
  afterEach(() => {
    clock.restore(); // restore Date.now
    sinon.restore();
  });

  describe('update', () => {
    it('works correctly', async () => {
      const request = { foo: 'bar' };
      const versionID = 'version.id';
      const runtime = {
        variables: { set: sinon.stub() },
        turn: { set: sinon.stub() },
        update: sinon.stub(),
        getRequest: sinon.stub().returns(request),
        services: {
          analyticsClient: {
            identify: sinon.stub().returns(request),
            track: sinon.stub().returns(request),
          },
        },
        getVersionID: sinon.stub().returns(versionID),
        getFinalState: sinon.stub().returns(request),
      };

      const input = {
        requestEnvelope: {
          session: {
            sessionId: 'session.id',
          },
        },
      };
      await update(runtime as any, input as any);
      const { timestamp } = runtime.services.analyticsClient.track.args[0][0];
      expect(runtime.turn.set.args).to.eql([
        [T.REQUEST, request],
        [T.TURNID, request],
      ]);
      expect(runtime.variables.set.args).to.eql([[V.TIMESTAMP, Math.floor(clock.now / 1000)]]);
      expect(runtime.services.analyticsClient.track.args).to.eql([
        [
          {
            id: versionID,
            event: Event.TURN,
            request: RequestType.REQUEST,
            payload: request,
            sessionid: input.requestEnvelope.session.sessionId,
            metadata: request,
            timestamp,
          },
        ],
      ]);
      expect(runtime.update.callCount).to.eql(1);
    });
  });
});
