import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import { CaptureHandler } from '@/lib/services/runtime/handlers/capture';
import { RequestType } from '@/lib/services/runtime/types';

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
        commandHandler: { canHandle: () => false },
        repeatHandler: { canHandle: () => false },
        addRepromptIfExists: sinon.stub(),
      };

      const captureHandler = CaptureHandler(utils as any);

      const node = { id: 'node-id' };
      const runtime = { turn: { get: sinon.stub().returns(null) } };
      const variables = { foo: 'bar' };

      expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(utils.addRepromptIfExists.args).to.eql([[{ node, runtime, variables }]]);
    });

    it('request type not intent', () => {
      const utils = {
        commandHandler: { canHandle: () => false },
        repeatHandler: { canHandle: () => false },
        addRepromptIfExists: sinon.stub(),
      };

      const captureHandler = CaptureHandler(utils as any);

      const node = { id: 'node-id' };
      const runtime = { turn: { get: sinon.stub().returns({ type: 'random' }) } };
      const variables = { foo: 'bar' };

      expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(utils.addRepromptIfExists.args).to.eql([[{ node, runtime, variables }]]);
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

        const node = { id: 'node-id' };
        const runtime = { turn: { get: sinon.stub().returns({ type: RequestType.INTENT }) } };
        const variables = { foo: 'bar' };

        expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(output);
        expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
        expect(utils.commandHandler.handle.args).to.eql([[runtime, variables]]);
      });

      describe('command cant handle', () => {
        it('no input', () => {
          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: { canHandle: () => false },
          };

          const captureHandler = CaptureHandler(utils as any);

          const node = { nextId: 'next-id' };
          const request = { type: RequestType.INTENT, payload: { intent: { slots: [] } } };
          const runtime = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { foo: 'bar' };

          expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.nextId);
          expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
        });

        it('no slot', () => {
          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: { canHandle: sinon.stub().returns(false) },
          };

          const captureHandler = CaptureHandler(utils as any);

          const node = { nextId: 'next-id' };
          const request = { type: RequestType.INTENT, payload: { intent: { slots: [null] } } };
          const runtime = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { foo: 'bar' };

          expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.nextId);
          expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
        });

        it('input not number', () => {
          const word = 'not number';

          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: { canHandle: sinon.stub().returns(false) },
            wordsToNumbers: sinon.stub().returns(word),
          };

          const captureHandler = CaptureHandler(utils as any);

          const node = { nextId: 'next-id', variable: 'var' };
          const input = 'input';
          const request = { type: RequestType.INTENT, payload: { intent: { slots: [{ value: input }] } } };
          const runtime = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { set: sinon.stub() };

          expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.nextId);
          expect(utils.wordsToNumbers.args).to.eql([[input]]);
          expect(variables.set.args).to.eql([[node.variable, input]]);
          expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
        });

        it('input is number', () => {
          const word = 1;

          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: { canHandle: sinon.stub().returns(false) },
            wordsToNumbers: sinon.stub().returns(word),
          };

          const captureHandler = CaptureHandler(utils as any);

          const node = { variable: 'var' };
          const input = 'input';
          const request = { type: RequestType.INTENT, payload: { intent: { slots: [{ value: input }] } } };
          const runtime = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { set: sinon.stub() };

          expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(null);
          expect(utils.wordsToNumbers.args).to.eql([[input]]);
          expect(variables.set.args).to.eql([[node.variable, word]]);
          expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
        });
      });
    });
  });
});
