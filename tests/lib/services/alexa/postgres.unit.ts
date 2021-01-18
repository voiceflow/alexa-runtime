import { expect } from 'chai';
import _ from 'lodash';
import format from 'pg-format';
import sinon from 'sinon';

import PostgresPersistenceAdapter from '@/lib/services/alexa/postgres';

describe('postgres persistence unit tests', () => {
  it('enabled', () => {
    expect(PostgresPersistenceAdapter.enabled({ SESSIONS_SOURCE: 'postgres' } as any)).to.eql(true);
    expect(PostgresPersistenceAdapter.enabled({ SESSIONS_SOURCE: 'dynamo' } as any)).to.eql(false);
  });

  describe('getAttributes', () => {
    it('not found', async () => {
      const pg = { sessionsTable: '_sessions', client: { query: sinon.stub().returns({ rows: [] }) }, format };
      const adapter = new PostgresPersistenceAdapter(pg as any);
      _.set(adapter, 'idGenerator', sinon.stub().returns('user-id'));

      expect(await adapter.getAttributes({} as any)).to.eql({});
    });

    it('found', async () => {
      const attributes = { foo: 'bar' };
      const pg = { sessionsTable: '_sessions', client: { query: sinon.stub().returns({ rows: [{ attributes }] }) }, format };
      const adapter = new PostgresPersistenceAdapter(pg as any);
      const userID = 'user-id';
      _.set(adapter, 'idGenerator', sinon.stub().returns(userID));

      expect(await adapter.getAttributes({} as any)).to.eql(attributes);
      expect(pg.client.query.args).to.eql([["SELECT attributes FROM _sessions WHERE id = 'user-id'"]]);
    });
  });

  describe('saveAttributes', () => {
    it('works', async () => {
      const pg = { sessionsTable: '_sessions', client: { query: sinon.stub() }, format };

      const adapter = new PostgresPersistenceAdapter(pg as any);
      const userID = 'user-id';
      _.set(adapter, 'idGenerator', sinon.stub().returns(userID));

      const attributes = { foo: 'bar' };
      await adapter.saveAttributes({} as any, attributes);

      expect(pg.client.query.args).to.eql([
        [
          'INSERT INTO _sessions (id, attributes) VALUES (\'user-id\', \'{"foo":"bar"}\'::jsonb) ON CONFLICT(id) DO UPDATE SET attributes = \'{"foo":"bar"}\'::jsonb',
        ],
      ]);
    });
  });

  it('deleteAttributes', async () => {
    const pg = { sessionsTable: '_sessions', client: { query: sinon.stub() }, format };
    const adapter = new PostgresPersistenceAdapter(pg as any);
    const userID = 'user-id';
    _.set(adapter, 'idGenerator', sinon.stub().returns(userID));

    await adapter.deleteAttributes({} as any);

    expect(pg.client.query.args).to.eql([["DELETE FROM _sessions WHERE id = 'user-id'"]]);
  });
});
