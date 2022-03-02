import { BaseNode } from '@voiceflow/base-types';
import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import { InteractionHandler } from '@/lib/services/runtime/handlers/interaction';
import { RequestType } from '@/lib/services/runtime/types';

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
      const runtime = { trace: { addTrace: sinon.stub() }, storage: { delete: sinon.stub() }, turn: { get: sinon.stub().returns(null) } };
      const variables = { foo: 'bar' };

      expect(interactionHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(utils.addRepromptIfExists.args).to.eql([[{ node, runtime, variables }]]);
      expect(runtime.trace.addTrace.args).to.eql([]);
      expect(runtime.storage.delete.args).to.eql([[S.NO_MATCHES_COUNTER]]);
    });

    it('request type not intent', () => {
      const utils = {
        addRepromptIfExists: sinon.stub(),
      };

      const captureHandler = InteractionHandler(utils as any);

      const node = { id: 'node-id', interactions: [] };
      const runtime = {
        trace: { addTrace: sinon.stub() },
        storage: { delete: sinon.stub() },
        turn: { get: sinon.stub().returns({ type: 'random' }) },
      };
      const variables = { foo: 'bar' };

      expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(utils.addRepromptIfExists.args).to.eql([[{ node, runtime, variables }]]);
      expect(runtime.trace.addTrace.args).to.eql([]);
      expect(runtime.storage.delete.args).to.eql([[S.NO_MATCHES_COUNTER]]);
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
        const runtime = {
          turn: { get: sinon.stub().returns({ type: RequestType.INTENT, payload: {} }) },
          storage: { get: sinon.stub().returns(undefined), delete: sinon.stub() },
        };
        const variables = { foo: 'bar' };

        expect(interactionHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(output);
        expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
        expect(utils.commandHandler.handle.args).to.eql([[runtime, variables]]);
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
              handle: sinon.stub().returns(null),
            },
          };

          const interactionHandler = InteractionHandler(utils as any);

          const node = { id: 'node-id', interactions: [{ intent: 'intent1' }, { intent: 'intent2' }] };
          const request = { type: RequestType.INTENT, payload: { intent: { name: 'random-intent' } } };
          const runtime = {
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { delete: sinon.stub(), get: sinon.stub().returns(undefined) },
          };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(null);
          expect(utils.formatIntentName.args).to.eql([[node.interactions[0].intent], [node.interactions[1].intent]]);
          expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
        });

        it('no choice with elseId', () => {
          const node = { id: 'node-id', elseId: 'else-id', interactions: [{ intent: 'intent1' }, { intent: 'intent2' }] };

          const utils = {
            formatIntentName: sinon.stub().returns(false),
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: {
              handle: sinon.stub().returns(node.elseId),
            },
          };

          const interactionHandler = InteractionHandler(utils as any);

          const request = { type: RequestType.INTENT, payload: { intent: { name: 'random-intent' } } };
          const runtime = {
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { delete: sinon.stub(), get: sinon.stub().returns(undefined) },
          };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.elseId);
        });

        it('local scope', () => {
          const node = {
            id: 'node-id',
            elseId: 'else-id',
            interactions: [{ intent: 'intent1' }, { intent: 'intent2' }],
            intentScope: BaseNode.Utils.IntentScope.NODE,
          };

          const utils = {
            formatIntentName: sinon.stub().returns(false),
            commandHandler: {
              canHandle: sinon.stub(),
            },
            repeatHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: {
              handle: sinon.stub().returns(node.elseId),
            },
          };

          const interactionHandler = InteractionHandler(utils as any);

          const request = { type: RequestType.INTENT, payload: { intent: { name: 'random-intent' } } };
          const runtime = {
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { delete: sinon.stub(), get: sinon.stub().returns(undefined) },
          };

          expect(interactionHandler.handle(node as any, runtime as any, {} as any, null as any)).to.eql(node.elseId);
          expect(utils.commandHandler.canHandle.callCount).to.eql(0);
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
          const runtime = {
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { get: sinon.stub().returns(undefined), delete: sinon.stub() },
          };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(nextId);
          expect(utils.formatIntentName.args).to.eql([[node.interactions[0].intent], [node.interactions[1].intent]]);
          expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
          expect(utils.noMatchHandler.handle.args).to.eql([[node, runtime, variables]]);
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
          };

          const interactionHandler = InteractionHandler(utils as any);

          const node = { id: 'node-id', elseId: 'else-id', interactions: [{ intent: 'random-intent  ' }], nextIds: ['id-one'] };
          const request = { type: RequestType.INTENT, payload: { intent: { name: intentName } } };
          const runtime = {
            trace: { debug: sinon.stub() },
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { delete: sinon.stub(), get: sinon.stub().returns(undefined) },
          };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.nextIds[0]);
          expect(runtime.trace.debug.args).to.eql([]);
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
          const runtime = {
            trace: { debug: sinon.stub() },
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { delete: sinon.stub(), get: sinon.stub().returns(undefined) },
          };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.nextIds[1]);
          expect(runtime.trace.debug.args).to.eql([]);
        });

        it('goto choice', () => {
          const intentName = 'random-intent';
          const goToIntentName = 'go-to-intent';

          const utils = {
            formatIntentName: sinon.stub().returns(intentName),
          };

          const interactionHandler = InteractionHandler(utils as any);

          const block = {
            id: 'block-id',
            elseId: 'else-id',
            interactions: [{ intent: 'random-intent', goTo: { intentName: goToIntentName } }],
            nextIds: ['id-one', 'id-two'],
          };
          const request = { type: RequestType.INTENT, payload: { intent: { name: intentName } } };
          const runtime = {
            turn: { get: sinon.stub().returns(request), delete: sinon.stub(), set: sinon.stub().resolves() },
            storage: { delete: sinon.stub(), get: sinon.stub().returns(undefined), set: sinon.stub() },
          };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(block as any, runtime as any, variables as any, null as any)).to.eql(block.id);
          expect(runtime.turn.set.args).to.eql([
            [
              T.DELEGATE,
              {
                name: goToIntentName,
                slots: {},
                confirmationStatus: 'NONE',
              },
            ],
          ]);
          expect(runtime.storage.set.callCount).to.eql(0);
        });

        it('skip interactions', () => {
          const intentName = 'other-intent';
          const block = {
            id: 'block-id',
            elseId: 'else-id',
            interactions: [{ intent: { name: 'random-intent' } }],
            nextIds: ['id-one', 'id-two'],
          };
          const utils = {
            formatIntentName: sinon.stub().callsFake(_.identity),
            noMatchHandler: { handle: sinon.stub().returns(block.elseId) },
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: {
              canHandle: sinon.stub().returns(false),
            },
          };

          const interactionHandler = InteractionHandler(utils as any);

          const request = { type: RequestType.INTENT, payload: { intent: { name: intentName } } };
          const runtime = {
            turn: { get: sinon.stub().returns(request), delete: sinon.stub(), set: sinon.stub().resolves() },
          };
          const variables = { foo: 'bar' };

          expect(interactionHandler.handle(block as any, runtime as any, variables as any, null as any)).to.eql(block.elseId);
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
          const runtime = {
            trace: { debug: sinon.stub() },
            turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
            storage: { delete: sinon.stub(), get: sinon.stub().returns(undefined) },
          };
          const variables = { merge: sinon.stub() };

          expect(interactionHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.nextIds[0]);
          expect(utils.mapSlots.args).to.eql([[{ mappings: node.interactions[0].mappings, slots: request.payload.intent.slots }]]);
          expect(variables.merge.args).to.eql([[mappedSlots]]);
          expect(runtime.trace.debug.args).to.eql([]);
        });
      });
    });
  });
});
