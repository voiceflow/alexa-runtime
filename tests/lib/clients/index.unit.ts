import { expect } from 'chai';
import sinon from 'sinon';

import { initClients, stopClients } from '@/lib/clients';

describe('client unit tests', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('initClients', () => {
    it('mongo/pg state enabled', async () => {
      const clients = {
        mongo: { start: sinon.stub() },
        pg: { start: sinon.stub() },
      };

      await initClients({ SESSIONS_SOURCE: 'mongo' } as any, clients as any);

      expect(clients.mongo.start.callCount).to.eql(1);
      expect(clients.pg.start.callCount).to.eql(1);
    });
  });

  describe('stopClients', () => {
    it('mongo/pg state disabled', async () => {
      const clients = {};

      expect(await stopClients({ SESSIONS_SOURCE: 'dynamo' } as any, clients as any)).to.eql(undefined);
    });

    it('mongo/pg state enabled', async () => {
      const clients = { mongo: { stop: sinon.stub() }, pg: { stop: sinon.stub() } };

      await stopClients({ SESSIONS_SOURCE: 'mongo' } as any, clients as any);

      expect(clients.mongo.stop.callCount).to.eql(1);
      expect(clients.pg.stop.callCount).to.eql(1);
    });
  });
});
