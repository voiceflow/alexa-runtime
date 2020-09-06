import { PartitionKeyGenerators, PersistenceAdapter } from 'ask-sdk';
import { RequestEnvelope } from 'ask-sdk-model';

/**
 * A lazy implementation of https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/blob/2.0.x/ask-sdk-dynamodb-persistence-adapter/lib/attributes/persistence/DynamoDbPersistenceAdapter.ts
 */
export class MemoryPersistenceAdapter implements PersistenceAdapter {
  public table: Record<string, any> = {};

  private idGenerator = PartitionKeyGenerators.userId;

  async getAttributes(requestEnvelope: RequestEnvelope) {
    const userId = this.idGenerator(requestEnvelope);
    return this.table[userId] || {};
  }

  async saveAttributes(requestEnvelope: RequestEnvelope, attributes: Record<string, any>) {
    const userId = this.idGenerator(requestEnvelope);
    this.table[userId] = attributes;
  }

  async deleteAttributes(requestEnvelope: RequestEnvelope) {
    const userId = this.idGenerator(requestEnvelope);
    delete this.table[userId];
  }
}

export default MemoryPersistenceAdapter;
