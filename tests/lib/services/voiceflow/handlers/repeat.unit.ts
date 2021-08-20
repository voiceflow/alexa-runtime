import { Constants } from '@voiceflow/alexa-types';
import { Version as BaseVersion } from '@voiceflow/base-types';
import { expect } from 'chai';
import sinon from 'sinon';

import { F, S, T } from '@/lib/constants';
import RepeatHandler from '@/lib/services/runtime/handlers/repeat';

describe('repeat handler', () => {
  const repeatHandler = RepeatHandler();
  const intentRequest = { payload: { intent: { name: Constants.AmazonIntent.REPEAT } } };

  describe('can handle', () => {
    it('true', () => {
      const runtime = { turn: { get: sinon.stub().returns(intentRequest) }, storage: { get: sinon.stub().returns(BaseVersion.RepeatType.ALL) } };
      expect(repeatHandler.canHandle(runtime as any)).to.eql(true);
      expect(runtime.storage.get.args[0][0]).to.eql(S.REPEAT);
      expect(runtime.turn.get.args[0][0]).to.eql(T.REQUEST);
    });

    it('false', () => {
      expect(
        repeatHandler.canHandle({
          turn: { get: sinon.stub().returns(null) },
          storage: { get: sinon.stub().returns(BaseVersion.RepeatType.ALL) },
        } as any)
      ).to.eql(false);
      expect(
        repeatHandler.canHandle({
          turn: { get: sinon.stub().returns(intentRequest) },
          storage: { get: sinon.stub().returns(BaseVersion.RepeatType.OFF) },
        } as any)
      ).to.eql(false);
      expect(
        repeatHandler.canHandle({
          turn: { get: sinon.stub().returns({ payload: { intent: { name: 'foo' } } }) },
          storage: { get: sinon.stub().returns(100) },
        } as any)
      ).to.eql(false);
    });

    describe('handle', () => {
      it('minimal repeat', () => {
        const frame = {
          getNodeID: sinon.stub().returns('node'),
          storage: { get: sinon.stub().returns('foo') },
        };

        const runtime = {
          storage: {
            get: sinon.stub().returns(BaseVersion.RepeatType.OFF),
            produce: sinon.stub(),
          },
          turn: {
            get: sinon.stub(),
          },
          stack: {
            top: sinon.stub().returns(frame),
          },
        };

        repeatHandler.handle(runtime as any);

        expect(runtime.storage.get.args[0][0]).to.eql(S.REPEAT);
        expect(runtime.stack.top.callCount).to.eql(1);
        expect(frame.storage.get.args[0][0]).to.eql(F.SPEAK);
        expect(runtime.turn.get.callCount).to.eql(0);

        const fn = runtime.storage.produce.args[0][0];

        const draft = {
          [S.OUTPUT]: 'before ',
        };

        fn(draft);
        expect(draft[S.OUTPUT]).to.eql('before foo');
      });

      it('max repeat', () => {
        const frame = {
          getNodeID: sinon.stub().returns('node'),
          storage: { get: sinon.stub().returns('foo') },
        };

        const runtime = {
          storage: {
            get: sinon.stub().returns(BaseVersion.RepeatType.ALL),
            produce: sinon.stub(),
          },
          turn: {
            get: sinon.stub().returns('test'),
          },
          stack: {
            top: sinon.stub().returns(frame),
          },
        };

        repeatHandler.handle(runtime as any);

        expect(runtime.storage.get.args[0][0]).to.eql(S.REPEAT);
        expect(runtime.stack.top.callCount).to.eql(1);
        expect(frame.storage.get.callCount).to.eql(0);
        expect(runtime.turn.get.args[0][0]).to.eql(T.PREVIOUS_OUTPUT);

        const fn = runtime.storage.produce.args[0][0];

        const draft = {
          [S.OUTPUT]: 'before ',
        };

        fn(draft);
        expect(draft[S.OUTPUT]).to.eql('before test');
      });
    });
  });
});
