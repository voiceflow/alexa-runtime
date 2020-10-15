import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import { InteractionHandler } from '@/lib/services/voiceflow/handlers/interaction';
import { RequestType } from '@/lib/services/voiceflow/types';

describe('interaction handler unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('canHandle', () => {
    it('false', async () => {
      expect(InteractionHandler(null as any).canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', async () => {
      expect(InteractionHandler(null as any).canHandle({ interactions: { foo: 'bar' } } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no request', () => {
      const utils = {
        addRepromptIfExists: sinon.stub(),
      };

      const interactionHandler = InteractionHandler(utils as any);

      const node = { id: 'node-id', interactions: [{ intent: 'one' }, { intent: 'two' }] };
      const context = { trace: { addTrace: sinon.stub() }, storage: { delete: sinon.stub() }, turn: { get: sinon.stub().returns(null) } };
      const variables = { foo: 'bar' };

      expect(interactionHandler.handle(node as any, context as any, variables as any, null as any)).to.eql(node.id);
      expect(utils.addRepromptIfExists.args).to.eql([[node, context, variables]]);
      expect(context.trace.addTrace.args[0][0]).to.eql({ type: 'choice', payload: { choices: [{ name: 'one' }, { name: 'two' }] } });
      expect(context.storage.delete.args).to.eql([[S.NO_MATCHES_COUNTER]]);
    });

    it('request type not intent', () => {
      const utils = {
        addRepromptIfExists: sinon.stub(),
      };

      const captureHandler = InteractionHandler(utils as any);

      const node = { id: 'node-id', interactions: [] };
      const context = {
        trace: { addTrace: sinon.stub() },
        storage: { delete: sinon.stub() },
        turn: { get: sinon.stub().returns({ type: 'random' }) },
      };
      const variables = { foo: 'bar' };

      expect(captureHandler.handle(node as any, context as any, variables as any, null as any)).to.eql(node.id);
      expect(utils.addRepromptIfExists.args).to.eql([[node, context, variables]]);
      expect(context.trace.addTrace.args[0][0]).to.eql({ type: 'choice', payload: { choices: [] } });
      expect(context.storage.delete.args).to.eql([[S.NO_MATCHES_COUNTER]]);
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

        const interactionHandler = InteractionHandler(utils as any);

        const node = { id: 'node-id', interactions: [] };
        const context = { turn: { get: sinon.stub().returns({ type: RequestType.INTENT, payload: {} }) } };
        const variables = { foo: 'bar' };

        expect(interactionHandler.handle(node as any, context as any, variables as any, null as any)).to.eql(output);
        expect(utils.commandHandler.canHandle.args).to.eql([[context]]);
        expect(utils.commandHandler.handle.args).to.eql([[context, variables]]);
      });

      describe('command cant handle', () => {
        it('no choice', () => {
          const utils = {
            formatIntentName: sinon.stub().returns(false),
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: {
              canHandle: sinon.stub().returns(false),
            },
          };

          const interactionHandler = InteractionHandler(utils as any);

          const node = { id: 'node-id', interactions: [{ intent: 'intent1' }, { intent: 'intent2' }] };
          const request = { type: RequestType.INTENT, payload: { intent: { name: 'random-intent' } } };
          const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() }, storage: { delete: sinon.stub() } };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, context as any, variables as any, null as any)).to.eql(null);
          expect(utils.formatIntentName.args).to.eql([[node.interactions[0].intent], [node.interactions[1].intent]]);
          expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
        });

        it('no choice with elseId', () => {
          const utils = {
            formatIntentName: sinon.stub().returns(false),
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: {
              canHandle: sinon.stub().returns(false),
            },
          };

          const interactionHandler = InteractionHandler(utils as any);

          const node = { id: 'node-id', elseId: 'else-id', interactions: [{ intent: 'intent1' }, { intent: 'intent2' }] };
          const request = { type: RequestType.INTENT, payload: { intent: { name: 'random-intent' } } };
          const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() }, storage: { delete: sinon.stub() } };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, context as any, variables as any, null as any)).to.eql(node.elseId);
        });

        it('no choice with noMatches', () => {
          const nextId = 'next-id';
          const noMatches = ['speak1', 'speak2', 'speak3'];

          const utils = {
            formatIntentName: sinon.stub().returns(false),
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: {
              canHandle: sinon.stub().returns(true),
              handle: sinon.stub().returns(nextId),
            },
          };

          const interactionHandler = InteractionHandler(utils as any);

          const node = {
            id: 'node-id',
            interactions: [{ intent: 'intent1' }, { intent: 'intent2' }],
            noMatches,
          };
          const request = { type: RequestType.INTENT, payload: { intent: { name: 'random-intent' } } };
          const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, context as any, variables as any, null as any)).to.eql(nextId);
          expect(utils.formatIntentName.args).to.eql([[node.interactions[0].intent], [node.interactions[1].intent]]);
          expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
          expect(utils.noMatchHandler.canHandle.args).to.eql([[node, context]]);
          expect(utils.noMatchHandler.handle.args).to.eql([[node, context, variables]]);
        });

        it('choice without mappings', () => {
          const intentName = 'random-intent';

          const utils = {
            formatIntentName: sinon.stub().returns(intentName),
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: {
              canHandle: sinon.stub().returns(false),
            },
          };

          const interactionHandler = InteractionHandler(utils as any);

          const node = { id: 'node-id', elseId: 'else-id', interactions: [{ intent: 'random-intent  ' }], nextIds: ['id-one'] };
          const request = { type: RequestType.INTENT, payload: { intent: { name: intentName } } };
          const context = {
            trace: { debug: sinon.stub() },
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { delete: sinon.stub() },
          };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, context as any, variables as any, null as any)).to.eql(node.nextIds[0]);
          expect(context.trace.debug.args).to.eql([[`matched choice **${node.interactions[0].intent}** - taking path ${0 + 1}`]]);
        });

        it('choice without mappings but nextIdIndex', () => {
          const intentName = 'random-intent';

          const utils = {
            formatIntentName: sinon.stub().returns(intentName),
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: {
              canHandle: sinon.stub().returns(false),
            },
          };

          const interactionHandler = InteractionHandler(utils as any);

          const node = {
            id: 'node-id',
            elseId: 'else-id',
            interactions: [{ intent: 'random-intent  ', nextIdIndex: 1 }],
            nextIds: ['id-one', 'id-two'],
          };
          const request = { type: RequestType.INTENT, payload: { intent: { name: intentName } } };
          const context = {
            trace: { debug: sinon.stub() },
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { delete: sinon.stub() },
          };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, context as any, variables as any, null as any)).to.eql(node.nextIds[1]);
          expect(context.trace.debug.args).to.eql([[`matched choice **${node.interactions[0].intent}** - taking path ${0 + 1}`]]);
        });

        it('choice with mappings', () => {
          const intentName = 'random-intent';
          const mappedSlots = { slot1: 'slot-1' };

          const utils = {
            formatIntentName: sinon.stub().returns(intentName),
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: {
              canHandle: sinon.stub().returns(false),
            },
            mapSlots: sinon.stub().returns(mappedSlots),
          };

          const interactionHandler = InteractionHandler(utils as any);

          const node = {
            id: 'node-id',
            elseId: 'else-id',
            interactions: [{ intent: 'random-intent  ', mappings: { foo: 'bar' } }],
            nextIds: ['id-one'],
          };
          const request = { type: RequestType.INTENT, payload: { intent: { name: intentName, slots: { foo2: 'bar2' } } } };
          const context = {
            trace: { debug: sinon.stub() },
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { delete: sinon.stub() },
          };
          const variables = { merge: sinon.stub() };

          expect(interactionHandler.handle(node as any, context as any, variables as any, null as any)).to.eql(node.nextIds[0]);
          expect(utils.mapSlots.args).to.eql([[node.interactions[0].mappings, request.payload.intent.slots]]);
          expect(variables.merge.args).to.eql([[mappedSlots]]);
          expect(context.trace.debug.args).to.eql([[`matched choice **${node.interactions[0].intent}** - taking path ${0 + 1}`]]);
        });
      });
    });
  });
});
