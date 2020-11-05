import { AmazonIntent } from '@voiceflow/alexa-types';
import { RepeatType } from '@voiceflow/general-types';
import { expect } from 'chai';
import sinon from 'sinon';

import { F, S, T } from '@/lib/constants';
import RepeatHandler from '@/lib/services/voiceflow/handlers/repeat';

describe('repeat handler', () => {
  const repeatHandler = RepeatHandler();
  const intentRequest = { payload: { intent: { name: AmazonIntent.REPEAT } } };

  describe('can handle', () => {
    it('true', () => {
      const context = { turn: { get: sinon.stub().returns(intentRequest) }, storage: { get: sinon.stub().returns(RepeatType.ALL) } };
      expect(repeatHandler.canHandle(context as any)).to.eql(true);
      expect(context.storage.get.args[0][0]).to.eql(S.REPEAT);
      expect(context.turn.get.args[0][0]).to.eql(T.REQUEST);
    });

    it('false', () => {
      expect(
        repeatHandler.canHandle({ turn: { get: sinon.stub().returns(null) }, storage: { get: sinon.stub().returns(RepeatType.ALL) } } as any)
      ).to.eql(false);
      expect(
        repeatHandler.canHandle({ turn: { get: sinon.stub().returns(intentRequest) }, storage: { get: sinon.stub().returns(RepeatType.OFF) } } as any)
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

        const context = {
          storage: {
            get: sinon.stub().returns(RepeatType.OFF),
            produce: sinon.stub(),
          },
          turn: {
            get: sinon.stub(),
          },
          stack: {
            top: sinon.stub().returns(frame),
          },
        };

        repeatHandler.handle(context as any);

        expect(context.storage.get.args[0][0]).to.eql(S.REPEAT);
        expect(context.stack.top.callCount).to.eql(1);
        expect(frame.storage.get.args[0][0]).to.eql(F.SPEAK);
        expect(context.turn.get.callCount).to.eql(0);

        const fn = context.storage.produce.args[0][0];

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

        const context = {
          storage: {
            get: sinon.stub().returns(RepeatType.ALL),
            produce: sinon.stub(),
          },
          turn: {
            get: sinon.stub().returns('test'),
          },
          stack: {
            top: sinon.stub().returns(frame),
          },
        };

        repeatHandler.handle(context as any);

        expect(context.storage.get.args[0][0]).to.eql(S.REPEAT);
        expect(context.stack.top.callCount).to.eql(1);
        expect(frame.storage.get.callCount).to.eql(0);
        expect(context.turn.get.args[0][0]).to.eql(T.PREVIOUS_OUTPUT);

        const fn = context.storage.produce.args[0][0];

        const draft = {
          [S.OUTPUT]: 'before ',
        };

        fn(draft);
        expect(draft[S.OUTPUT]).to.eql('before test');
      });
    });
  });
});
