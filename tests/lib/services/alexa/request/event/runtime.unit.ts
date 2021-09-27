import { expect } from 'chai';
import sinon from 'sinon';

import { _getEvent } from '@/lib/services/alexa/request/event/runtime';
import { RequestType } from '@/lib/services/runtime/types';

describe('alexa request event unit tests', () => {
  describe('_getEvent', () => {
    it('works', () => {
      const runtime = { stack: 'stack-val', getRequest: sinon.stub().returns({ type: RequestType.EVENT, payload: { event: 'event-val' } }) };
      const extractFrame = sinon.stub().returns({ index: 'index-val', command: 'command-val' });

      expect(_getEvent(runtime as any, extractFrame)).to.eql({ index: 'index-val', command: 'command-val', event: 'event-val' });
      expect(runtime.getRequest.args).to.eql([[]]);
      expect(extractFrame.callCount).to.eql(1);
      expect(extractFrame.args[0][0]).to.eql('stack-val');
      expect(extractFrame.args[0][1]).instanceof(Function);
    });

    it('works with a non Event type', () => {
      const runtime = { stack: 'stack-val', getRequest: sinon.stub().returns({ type: 'abc', payload: { event: '' } }) };
      const extractFrame = sinon.stub().returns({ index: 'index-val', command: 'command-val' });

      expect(_getEvent(runtime as any, extractFrame)).to.eql(null);
      expect(runtime.getRequest.args).to.eql([[]]);
      expect(extractFrame.callCount).to.eql(0);
    });

    it('works with a no request', () => {
      const runtime = { stack: 'stack-val', getRequest: sinon.stub().returns(undefined) };
      const extractFrame = sinon.stub().returns({ index: 'index-val', command: 'command-val' });

      expect(_getEvent(runtime as any, extractFrame)).to.eql(null);
      expect(runtime.getRequest.args).to.eql([[]]);
      expect(extractFrame.callCount).to.eql(0);
    });

    it('works with extractFrame returning falsy', () => {
      const runtime = { stack: 'stack-val', getRequest: sinon.stub().returns({ type: RequestType.EVENT, payload: { event: 'event-val' } }) };
      const extractFrame = sinon.stub().returns(undefined);

      expect(_getEvent(runtime as any, extractFrame)).to.eql(null);
      expect(runtime.getRequest.args).to.eql([[]]);
      expect(extractFrame.callCount).to.eql(1);
      expect(extractFrame.args[0][0]).to.eql('stack-val');
      expect(extractFrame.args[0][1]).instanceof(Function);
    });
  });
});
