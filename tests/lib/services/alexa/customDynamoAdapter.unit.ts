import { DynamoDB } from 'aws-sdk';
import { expect } from 'chai';
import sinon from 'sinon';

import CustomDynamoDbPersistenceAdapter from '@/lib/services/alexa/customDynamoAdapter';

describe('alexa customDynamoAdapter unit tests', () => {
  it('constructs properly', () => {
    const ctorStub = sinon.stub(DynamoDB, 'DocumentClient');

    // eslint-disable-next-line no-new
    new CustomDynamoDbPersistenceAdapter({ tableName: 'foo' });

    // First call is from super(config), where convertEmptyValues is set to true
    // Second call is to override convertEmptyValues to false
    expect(ctorStub.callCount).to.eql(2);
    sinon.assert.calledWith(ctorStub.firstCall, { convertEmptyValues: true, service: sinon.match.any });
    sinon.assert.calledWith(ctorStub.secondCall, { convertEmptyValues: false, service: sinon.match.any });
  });
});
