import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import { EMPTY_AUDIO_STRING, NoMatchHandler } from '@/lib/services/runtime/handlers/noMatch';

const GlobalNoMatch = { prompt: { voice: 'Alexa', content: 'Sorry, could not understand what you said' } };

describe('noMatch handler unit tests', () => {
  describe('handle', () => {
    it('next id', () => {
      const node = {
        id: 'node-id',
        noMatch: {
          nodeID: 'next-id',
          prompts: ['a', 'b'],
        },
      };
      const runtime = {
        storage: {
          delete: sinon.stub(),
          get: sinon.stub().returns(2),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };
      const noMatchHandler = NoMatchHandler();
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any)).to.eql(node.noMatch.nodeID);
    });

    it('with old noMatch format', () => {
      const node = {
        id: 'node-id',
        noMatches: ['the counter is {counter}'],
      };
      const runtime = {
        storage: {
          produce: sinon.stub(),
          set: sinon.stub(),
          get: sinon.stub().returns(0),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({ counter: 5.2345 }),
      };

      const noMatchHandler = NoMatchHandler();
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any)).to.eql(node.id);
      expect(runtime.trace.addTrace.args).to.eql([
        [
          {
            type: 'speak',
            payload: {
              message: 'the counter is 5.23',
              type: 'message',
            },
          },
        ],
      ]);

      expect(runtime.storage.set.args).to.eql([[S.NO_MATCHES_COUNTER, 1]]);

      // adds output
      const cb2 = runtime.storage.produce.args[0][0];
      const draft3 = { [S.OUTPUT]: 'msg: ' };
      cb2(draft3);
      expect(draft3).to.eql({ [S.OUTPUT]: 'msg: the counter is 5.23' });
    });

    it('with new noMatch format', () => {
      const node = {
        id: 'node-id',
        noMatch: {
          prompts: ['the counter is {counter}'],
        },
      };
      const runtime = {
        storage: {
          set: sinon.stub(),
          produce: sinon.stub(),
          get: sinon.stub().returns(null),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({ counter: 5.2345 }),
      };

      const noMatchHandler = NoMatchHandler();
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any)).to.eql(node.id);
      expect(runtime.trace.addTrace.args).to.eql([
        [
          {
            type: 'speak',
            payload: {
              message: 'the counter is 5.23',
              type: 'message',
            },
          },
        ],
      ]);

      expect(runtime.storage.set.args).to.eql([[S.NO_MATCHES_COUNTER, 1]]);

      // adds output
      const cb2 = runtime.storage.produce.args[0][0];
      const draft3 = { [S.OUTPUT]: 'msg: ' };
      cb2(draft3);
      expect(draft3).to.eql({ [S.OUTPUT]: 'msg: the counter is 5.23' });
    });

    it('with global noMatch', () => {
      const node = {
        id: 'node-id',
        noMatch: {
          prompts: [],
        },
      };
      const runtime = {
        storage: {
          set: sinon.stub(),
          produce: sinon.stub(),
          delete: sinon.stub(),
          get: sinon.stub().returns(null),
        },
        trace: {
          addTrace: sinon.stub(),
        },
        version: {
          platformData: {
            settings: {
              globalNoMatch: GlobalNoMatch,
            },
          },
        },
      };
      const variables = {
        getState: sinon.stub().returns({ counter: 5.2345 }),
      };

      const noMatchHandler = NoMatchHandler();
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any)).to.eql(node.id);
      expect(runtime.trace.addTrace.args).to.eql([
        [
          {
            type: 'speak',
            payload: {
              message: 'Sorry, could not understand what you said',
              type: 'message',
            },
          },
        ],
      ]);

      expect(runtime.storage.set.args).to.eql([[S.NO_MATCHES_COUNTER, 1]]);

      // adds output
      const cb2 = runtime.storage.produce.args[0][0];
      const draft3 = { [S.OUTPUT]: 'msg: ' };
      cb2(draft3);
      expect(draft3).to.eql({ [S.OUTPUT]: 'msg: Sorry, could not understand what you said' });
    });

    it('without noMatch', () => {
      const node = {
        id: 'node-id',
      };
      const runtime = {
        storage: {
          set: sinon.stub(),
          delete: sinon.stub(),
          get: sinon.stub(),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const noMatchHandler = NoMatchHandler();
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any)).to.eql(null);
      expect(runtime.trace.addTrace.callCount).to.eql(0);
    });

    it('with choices', () => {
      const node = {
        id: 'node-id',
        interactions: [{ intent: 'address_intent' }, { intent: 'phone_number_intent' }],
      };
      const runtime = {
        storage: {
          set: sinon.stub(),
          delete: sinon.stub(),
          get: sinon.stub().returns(0),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const noMatchHandler = NoMatchHandler();
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any)).to.eql(null);
      expect(runtime.trace.addTrace.callCount).to.eql(0);
    });

    it('with noMatch randomized', () => {
      const node = {
        id: 'node-id',
        noMatch: {
          prompts: ['A', 'B', 'C'],
          randomize: true,
        },
      };
      const runtime = {
        storage: {
          set: sinon.stub(),
          produce: sinon.stub(),
          get: sinon.stub().returns(0),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const noMatchHandler = NoMatchHandler();
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any)).to.eql(node.id);
      expect(node.noMatch.prompts.includes(runtime.trace.addTrace.args[0][0].payload.message)).to.eql(true);
    });

    it('with noMatch null speak string', () => {
      const NON_NULL_STRING = 'Josh was here';
      const node = {
        id: 'node-id',
        noMatches: [null, NON_NULL_STRING],
      };
      const runtime = {
        storage: {
          set: sinon.stub(),
          produce: sinon.stub(),
          get: sinon.stub().returns(0),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const noMatchHandler = NoMatchHandler();
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any)).to.eql(node.id);
      expect(runtime.trace.addTrace.args[0][0].payload.message).to.eql(NON_NULL_STRING);
    });

    it('with noMatch empty audio', () => {
      const NON_NULL_STRING = 'Josh was here';
      const node = {
        id: 'node-id',
        noMatches: [EMPTY_AUDIO_STRING, NON_NULL_STRING],
      };
      const runtime = {
        storage: {
          set: sinon.stub(),
          produce: sinon.stub(),
          get: sinon.stub().returns(0),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const noMatchHandler = NoMatchHandler();
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any)).to.eql(node.id);
      expect(runtime.trace.addTrace.args[0][0].payload.message).to.eql(NON_NULL_STRING);
    });
  });
});
