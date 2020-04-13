import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import update from '@/lib/services/alexa/request/lifecycle/update';

describe('update lifecycle unit tests', () => {
  describe('update', () => {
    it('works correctly', async () => {
      const request = { foo: 'bar' };
      const context = { turn: { set: sinon.stub() }, update: sinon.stub(), getRequest: sinon.stub().returns(request) };

      await update(context as any);
      expect(context.turn.set.args).to.eql([[T.REQUEST, request]]);
      expect(context.update.callCount).to.eql(1);
    });
  });
});
