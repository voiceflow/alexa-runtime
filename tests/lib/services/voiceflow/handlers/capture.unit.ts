import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import { CaptureHandler } from '@/lib/services/voiceflow/handlers/capture';
import { RequestType } from '@/lib/services/voiceflow/types';

describe('capture handler unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('canHandle', () => {
    it('false', async () => {
      expect(CaptureHandler(null as any).canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', async () => {
      expect(CaptureHandler(null as any).canHandle({ variable: 'var1' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no request', () => {
      const utils = {
        addRepromptIfExists: sinon.stub(),
      };

      const captureHandler = CaptureHandler(utils as any);

      const block = { blockID: 'block-id' };
      const context = { turn: { get: sinon.stub().returns(null) } };
      const variables = { foo: 'bar' };

      expect(captureHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.blockID);
      expect(utils.addRepromptIfExists.args).to.eql([[block, context, variables]]);
    });

    it('request type not intent', () => {
      const utils = {
        addRepromptIfExists: sinon.stub(),
      };

      const captureHandler = CaptureHandler(utils as any);

      const block = { blockID: 'block-id' };
      const context = { turn: { get: sinon.stub().returns({ type: 'random' }) } };
      const variables = { foo: 'bar' };

      expect(captureHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.blockID);
      expect(utils.addRepromptIfExists.args).to.eql([[block, context, variables]]);
    });

    describe('request type is intent', () => {
      it('command handler can handle', () => {
        const output = 'bar';

        const utils = {
          commandHandler: {
            canHandle: sinon.stub().returns(true),
            handle: sinon.stub().returns(output),
          },
        };

        const captureHandler = CaptureHandler(utils as any);

        const block = { blockID: 'block-id' };
        const context = { turn: { get: sinon.stub().returns({ type: RequestType.INTENT }) } };
        const variables = { foo: 'bar' };

        expect(captureHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(output);
        expect(utils.commandHandler.canHandle.args).to.eql([[context]]);
        expect(utils.commandHandler.handle.args).to.eql([[context, variables]]);
      });

      describe('command cant handle', () => {
        it('no input', () => {
          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
          };

          const captureHandler = CaptureHandler(utils as any);

          const block = { nextId: 'next-id' };
          const request = { type: RequestType.INTENT, payload: { intent: { slots: [] } } };
          const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { foo: 'bar' };

          expect(captureHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.nextId);
          expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
        });

        it('no slot', () => {
          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
          };

          const captureHandler = CaptureHandler(utils as any);

          const block = { nextId: 'next-id' };
          const request = { type: RequestType.INTENT, payload: { intent: { slots: [null] } } };
          const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { foo: 'bar' };

          expect(captureHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.nextId);
          expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
        });

        it('input not number', () => {
          const word = 'not number';

          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            wordsToNumbers: sinon.stub().returns(word),
          };

          const captureHandler = CaptureHandler(utils as any);

          const block = { nextId: 'next-id', variable: 'var' };
          const input = 'input';
          const request = { type: RequestType.INTENT, payload: { intent: { slots: [{ value: input }] } } };
          const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { set: sinon.stub() };

          expect(captureHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.nextId);
          expect(utils.wordsToNumbers.args).to.eql([[input]]);
          expect(variables.set.args).to.eql([[block.variable, input]]);
          expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
        });

        it('input is number', () => {
          const word = 1;

          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            wordsToNumbers: sinon.stub().returns(word),
          };

          const captureHandler = CaptureHandler(utils as any);

          const block = { variable: 'var' };
          const input = 'input';
          const request = { type: RequestType.INTENT, payload: { intent: { slots: [{ value: input }] } } };
          const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { set: sinon.stub() };

          expect(captureHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(null);
          expect(utils.wordsToNumbers.args).to.eql([[input]]);
          expect(variables.set.args).to.eql([[block.variable, word]]);
          expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
        });
      });
    });
  });
});
