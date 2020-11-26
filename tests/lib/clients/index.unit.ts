import { expect } from 'chai';
import sinon from 'sinon';

import { initClients, stopClients } from '@/lib/clients';

describe('client unit tests', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('initClients', () => {
    it('mongo state disabled', async () => {
      const clients = { dataAPI: { init: sinon.stub() } };

      await initClients({ SESSIONS_SOURCE: 'dynamo' } as any, clients as any);

      expect(clients.dataAPI.init.callCount).to.eql(1);
    });

    it('mongo state enabled', async () => {
      const clients = { dataAPI: { init: sinon.stub() }, mongo: { start: sinon.stub() } };

      await initClients({ SESSIONS_SOURCE: 'mongo' } as any, clients as any);

      expect(clients.dataAPI.init.callCount).to.eql(1);
      expect(clients.mongo.start.callCount).to.eql(1);
    });
  });

  describe('stopClients', () => {
    it('mongo state disabled', async () => {
      const clients = {};

      expect(await stopClients({ SESSIONS_SOURCE: 'dynamo' } as any, clients as any)).to.eql(undefined);
    });

    it('mongo state enabled', async () => {
      const clients = { mongo: { stop: sinon.stub() } };

      await stopClients({ SESSIONS_SOURCE: 'mongo' } as any, clients as any);

      expect(clients.mongo.stop.callCount).to.eql(1);
    });
  });
});
