import { expect } from 'chai';
import _ from 'lodash';
import postgres from 'pg';
import sinon from 'sinon';

import PostgresDB from '@/lib/clients/postgres';

describe('postgres client unit tests', () => {
  beforeEach(() => {
    sinon.restore();
  });

  it('start', async () => {
    const client = { end: sinon.stub(), query: sinon.stub() };
    const constructorStub = sinon.stub(postgres, 'Pool');
    constructorStub.returns(client);

    const config = {
      PG_USERNAME: 'username',
      PG_HOST: 'host',
      PG_DBNAME: 'db-name',
      PG_PASSWORD: 'password',
      PG_PORT: '5432',
    };

    const pg = new PostgresDB(config as any);

    await pg.start();

    expect(constructorStub.args).to.eql([
      [
        {
          user: config.PG_USERNAME,
          host: config.PG_HOST,
          database: config.PG_DBNAME,
          password: config.PG_PASSWORD,
          port: +config.PG_PORT,
        },
      ],
    ]);
    expect(pg.client).to.eql(client);
    expect(client.query.args).to.eql([
      [
        `CREATE TABLE IF NOT EXISTS ${pg.sessionsTable}(id VARCHAR(255) PRIMARY KEY, attributes JSONB DEFAULT '{}'::JSONB, modified TIMESTAMP DEFAULT NOW())`,
      ],
    ]);
  });

  describe('client', () => {
    it('undefined', () => {
      const pg = new PostgresDB({} as any);

      expect(() => {
        const dbObj = pg.client;
      }).to.throw('DB is undefined. start client first');
    });

    it('defined', () => {
      const dbObj = { foo: 'bar' };
      const pg = new PostgresDB({} as any);
      _.set(pg, '_client', dbObj);

      expect(pg.client).to.eql(dbObj);
    });
  });

  it('stop', async () => {
    const client = { end: sinon.stub() };

    const pg = new PostgresDB({} as any);
    _.set(pg, '_client', client);

    await pg.stop();

    expect(client.end.callCount).to.eql(1);
  });
});
