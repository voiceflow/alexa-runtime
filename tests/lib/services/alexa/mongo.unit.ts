import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';

import MongoPersistenceAdapter from '@/lib/services/alexa/mongo';

describe('mongo persistence unit tests', () => {
  it('enabled', () => {
    expect(MongoPersistenceAdapter.enabled({ SESSIONS_SOURCE: 'mongo' } as any)).to.eql(true);
    expect(MongoPersistenceAdapter.enabled({ SESSIONS_SOURCE: 'dynamo' } as any)).to.eql(false);
  });

  describe('getAttributes', () => {
    it('not found', async () => {
      const findOne = sinon.stub().returns(null);
      const mongo = { db: { collection: sinon.stub().returns({ findOne }) } };
      const adapter = new MongoPersistenceAdapter(mongo as any);
      _.set(adapter, 'idGenerator', sinon.stub().returns('user-id'));

      expect(await adapter.getAttributes({} as any)).to.eql({});
    });

    it('found', async () => {
      const attributes = { foo: 'bar' };
      const findOne = sinon.stub().returns({ attributes });
      const mongo = { db: { collection: sinon.stub().returns({ findOne }) } };
      const adapter = new MongoPersistenceAdapter(mongo as any);
      const userID = 'user-id';
      _.set(adapter, 'idGenerator', sinon.stub().returns(userID));

      expect(await adapter.getAttributes({} as any)).to.eql(attributes);
      expect(findOne.args).to.eql([[{ id: userID }]]);
    });
  });

  describe('saveAttributes', () => {
    it('throws', async () => {
      const updateOne = sinon.stub().returns({ result: { ok: false } });
      const mongo = { db: { collection: sinon.stub().returns({ updateOne }) } };
      const adapter = new MongoPersistenceAdapter(mongo as any);
      const userID = 'user-id';
      _.set(adapter, 'idGenerator', sinon.stub().returns(userID));

      await expect(adapter.saveAttributes({} as any, {} as any)).to.eventually.rejectedWith('store runtime session error');
    });

    it('works', async () => {
      const updateOne = sinon.stub().returns({ result: { ok: true } });
      const mongo = { db: { collection: sinon.stub().returns({ updateOne }) } };
      const adapter = new MongoPersistenceAdapter(mongo as any);
      const userID = 'user-id';
      _.set(adapter, 'idGenerator', sinon.stub().returns(userID));

      const attributes = { foo: 'bar' };
      await adapter.saveAttributes({} as any, attributes);

      expect(updateOne.args).to.eql([[{ id: userID }, { $set: { id: userID, attributes } }, { upsert: true }]]);
    });
  });

  it('deleteAttributes', async () => {
    const deleteOne = sinon.stub();
    const mongo = { db: { collection: sinon.stub().returns({ deleteOne }) } };
    const adapter = new MongoPersistenceAdapter(mongo as any);
    const userID = 'user-id';
    _.set(adapter, 'idGenerator', sinon.stub().returns(userID));

    await adapter.deleteAttributes({} as any);

    expect(deleteOne.args).to.eql([[{ id: userID }]]);
  });
});
