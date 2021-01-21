import { Pool } from 'pg';
import format from 'pg-format';

import config from '@/config';

import { AbstractClient } from './utils';

class PostgresDB extends AbstractClient {
  private _client: Pool | undefined;

  public format = format;

  public sessionsTable = '_sessions';

  async start() {
    this._client = new Pool({
      user: this.config.PG_USERNAME!,
      host: this.config.PG_HOST!,
      database: this.config.PG_DBNAME!,
      password: this.config.PG_PASSWORD!,
      port: +this.config.PG_PORT!,
    });

    await this.client.query(
      this.format(
        "CREATE TABLE IF NOT EXISTS %I(id VARCHAR(255) PRIMARY KEY, attributes JSONB DEFAULT '{}'::JSONB, modified TIMESTAMP DEFAULT NOW())",
        this.sessionsTable
      )
    );
  }

  get client() {
    if (!this._client) throw new Error('DB is undefined. start client first');

    return this._client;
  }

  async stop() {
    await this.client!.end();
  }
}

export const StaticPostgresDB = new PostgresDB(config);
StaticPostgresDB.start();

export default PostgresDB;
