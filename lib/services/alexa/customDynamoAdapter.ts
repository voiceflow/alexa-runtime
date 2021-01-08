import { DynamoDbPersistenceAdapter } from 'ask-sdk';
import { RequestEnvelope } from 'ask-sdk-model';
import { DynamoDB } from 'aws-sdk';

type PartitionKeyGenerator = (requestEnvelope: RequestEnvelope) => string;

class CustomDynamoDbPersistenceAdapter extends DynamoDbPersistenceAdapter {
  constructor(config: {
    tableName: string;
    partitionKeyName?: string;
    attributesName?: string;
    createTable?: boolean;
    dynamoDBClient?: DynamoDB;
    partitionKeyGenerator?: PartitionKeyGenerator;
  }) {
    super(config);
    this.dynamoDBDocumentClient = new DynamoDB.DocumentClient({
      convertEmptyValues: false,
      service: this.dynamoDBClient,
    });
  }
}

export default CustomDynamoDbPersistenceAdapter;
