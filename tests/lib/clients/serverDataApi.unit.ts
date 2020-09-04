import secretsProvider from '@voiceflow/secrets-provider';
import { expect } from 'chai';
import sinon from 'sinon';

import ServerDataAPI from '@/lib/clients/data/serverDataAPI';

describe('serverDataAPI client unit tests', () => {
  before(async () => {
    await secretsProvider.start({
      SECRETS_PROVIDER: 'test',
    });
  });

  describe('new', () => {
    it('works correctly', () => {
      const clients = { axios: { create: sinon.stub() } };
      const config = { VF_DATA_ENDPOINT: 'random' };

      // eslint-disable-next-line no-new
      new ServerDataAPI(clients as any, config as any);

      expect(clients.axios.create.args).to.eql([
        [
          {
            baseURL: config.VF_DATA_ENDPOINT,
            headers: { authorization: `Bearer ${'test'}` },
          },
        ],
      ]);
    });
  });

  describe('fetchDisplayById', () => {
    it('no data', async () => {
      const axios = { get: sinon.stub().returns({}) };
      const clients = { axios: { create: sinon.stub().returns(axios) } };
      const config = { VF_DATA_ENDPOINT: 'random' };

      const client = new ServerDataAPI(clients as any, config as any);

      const displayId = 1;
      expect(await client.fetchDisplayById(displayId)).to.eql(null);
      expect(axios.get.args).to.eql([[`/metadata/displays/${displayId}`]]);
    });

    it('with data', async () => {
      const data = { foo: 'bar' };
      const axios = { get: sinon.stub().returns({ data }) };
      const clients = { axios: { create: sinon.stub().returns(axios) } };
      const config = { VF_DATA_ENDPOINT: 'random' };

      const client = new ServerDataAPI(clients as any, config as any);

      const displayId = 1;
      expect(await client.fetchDisplayById(displayId)).to.eql(data);
    });
  });
});
