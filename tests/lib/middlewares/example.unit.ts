import { expect } from 'chai';
import sinon from 'sinon';

import Example from '@/lib/middlewares/example';

describe('example middleware unit tests', () => {
  beforeEach(() => sinon.restore());

  describe('checkExample', () => {
    it('throws error', async () => {
      const example = new Example({} as any, {} as any);
      const req = {
        headers: {},
      };
      await expect(example.checkExample(req as any, null, null)).to.eventually.rejectedWith('Token required');
    });

    it('calls next', async () => {
      const example = new Example({} as any, {} as any);
      const req = {
        headers: {
          token: 'random_token',
        },
      };
      const next = sinon.stub().resolves();

      await example.checkExample(req as any, null, next);
      expect(next.callCount).to.eql(1);
    });
  });
});
