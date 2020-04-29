import { expect } from 'chai';
import sinon from 'sinon';

import Test from '@/lib/controllers/test';

describe('test controller unit tests', () => {
  describe('handler', () => {
    it('works correctly', async () => {
      const output = 'output';

      const services = {
        test: { invoke: sinon.stub().resolves(output) },
        metrics: { increment: sinon.stub() },
      };

      const testController = new Test(services as any, null as any);

      const req = { body: { state: { foo: 'bar' }, request: 'request' } };
      expect(await testController.handler(req as any)).to.eql(output);
      expect(services.test.invoke.args).to.eql([[req.body.state, req.body.request]]);
      expect(services.metrics.increment.args).to.eql([['test.request']]);
    });
  });
});
