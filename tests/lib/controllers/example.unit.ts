import { expect } from 'chai';
import sinon from 'sinon';

import Example from '@/lib/controllers/example';

describe('example controller unit tests', () => {
  beforeEach(() => sinon.restore());

  describe('getExample', () => {
    it('throws error', async () => {
      const response = { foo: 'bar' };

      const exampleManager = {
        getExample: sinon.stub().resolves(response),
      };

      const example = new Example({ exampleManager } as any, {} as any);

      const req = { params: { id: 0 } };

      await expect(example.getExample(req as any)).to.eventually.rejectedWith('Invalid request');
    });

    it('returns correctly', async () => {
      const response = { foo: 'bar' };

      const exampleManager = {
        getExample: sinon.stub().resolves(response),
      };

      const example = new Example({ exampleManager } as any, {} as any);

      const req = { params: { id: 4 } };

      expect(await example.getExample(req as any)).to.eql(response);
    });
  });
});
