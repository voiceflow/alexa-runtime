import { PartitionKeyGenerators, PersistenceAdapter } from 'ask-sdk';
import { RequestEnvelope } from 'ask-sdk-model';

// import { ObjectId } from 'mongodb';
import MongoDb from '../../clients/mongodb';
/**
 * A mongo implementation of https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/blob/2.0.x/ask-sdk-dynamodb-persistence-adapter/lib/attributes/persistence/DynamoDbPersistenceAdapter.ts
 */
class MongoPersistenceAdapter implements PersistenceAdapter {
  public table: Record<string, any> = {};

  private collectionName = 'runtime-sessions';

  private idGenerator = PartitionKeyGenerators.userId;

  constructor(private mongo: MongoDb) {}

  async getAttributes(requestEnvelope: RequestEnvelope) {
    const userId = this.idGenerator(requestEnvelope);
    const session = await this.mongo.db
      .collection(this.collectionName)
      .findOne<{ attributes: object }>({ id: userId }, { projection: { attributes: true } });
    return session?.attributes || {};
  }

  async saveAttributes(requestEnvelope: RequestEnvelope, attributes: Record<string, any>) {
    const userId = this.idGenerator(requestEnvelope);
    const {
      result: { ok },
    } = await this.mongo.db.collection(this.collectionName).updateOne({ id: userId }, { $set: { id: userId, attributes } }, { upsert: true });

    if (!ok) {
      throw Error('store runtime session error');
    }
  }

  async deleteAttributes(requestEnvelope: RequestEnvelope) {
    const userId = this.idGenerator(requestEnvelope);

    await this.mongo.db.collection(this.collectionName).deleteOne({ id: userId });
  }
}

export default MongoPersistenceAdapter;
