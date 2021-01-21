import { PartitionKeyGenerators, PersistenceAdapter } from 'ask-sdk';
import { RequestEnvelope } from 'ask-sdk-model';

import { Config } from '@/types';

import Pg from '../../clients/postgres';
import { Source } from '../../constants';
/**
 * A postgres implementation of https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/blob/2.0.x/ask-sdk-dynamodb-persistence-adapter/lib/attributes/persistence/DynamoDbPersistenceAdapter.ts
 */
class PostgresPersistenceAdapter implements PersistenceAdapter {
  private idGenerator = PartitionKeyGenerators.userId;

  constructor(private pg: Pg) {}

  public static enabled(config: Config) {
    return config.SESSIONS_SOURCE === Source.POSTGRES;
  }

  async getAttributes(requestEnvelope: RequestEnvelope) {
    const userId = this.idGenerator(requestEnvelope);
    const session = (await this.pg.client.query(this.pg.format('SELECT attributes FROM %I WHERE id = %L', this.pg.sessionsTable, userId))).rows[0];
    return session?.attributes || {};
  }

  async saveAttributes(requestEnvelope: RequestEnvelope, attributes: Record<string, any>) {
    const userId = this.idGenerator(requestEnvelope);

    await this.pg.client.query(
      this.pg.format(
        'INSERT INTO %I (id, attributes) VALUES (%L, %L) ON CONFLICT(id) DO UPDATE SET attributes = %L, modified = NOW()',
        this.pg.sessionsTable,
        userId,
        attributes,
        attributes
      )
    );
  }

  async deleteAttributes(requestEnvelope: RequestEnvelope) {
    const userId = this.idGenerator(requestEnvelope);

    await this.pg.client.query(this.pg.format('DELETE FROM %I WHERE id = %L', this.pg.sessionsTable, userId));
  }
}

export default PostgresPersistenceAdapter;
