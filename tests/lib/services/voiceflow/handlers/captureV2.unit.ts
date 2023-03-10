import { BaseNode } from '@voiceflow/base-types';
import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import { CaptureV2Handler } from '@/lib/services/runtime/handlers/captureV2';
import { RequestType } from '@/lib/services/runtime/types';

describe('captureV2 handler unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('canHandle', () => {
    it('false', () => {
      expect(CaptureV2Handler(null as any).canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(
        CaptureV2Handler(null as any).canHandle({ type: 'captureV2' } as any, null as any, null as any, null as any)
      ).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no request', () => {
      const utils = {
        addRepromptIfExists: sinon.stub(),
      };

      const captureHandler = CaptureV2Handler(utils as any);

      const node = { id: 'node-id' };
      const runtime = { turn: { get: sinon.stub().returns(null) } };
      const variables = { foo: 'bar' };

      expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(utils.addRepromptIfExists.args).to.eql([[{ node, runtime, variables }]]);
    });

    it('delegation', () => {
      const utils = {
        addRepromptIfExists: sinon.stub(),
      };

      const captureHandler = CaptureV2Handler(utils as any);

      const slotName = 'slot1';
      const slotName2 = 'slot2';
      const node = { id: 'node-id', intent: { name: 'intent-name', entities: [slotName, slotName2] } };
      const runtime = { turn: { get: sinon.stub().returns(null), set: sinon.stub() } };
      const variables = { foo: 'bar' };

      expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(utils.addRepromptIfExists.args).to.eql([[{ node, runtime, variables }]]);
      expect(runtime.turn.set.args).to.eql([
        [
          T.ELICIT_SLOT,
          {
            slot: slotName,
            intent: {
              name: node.intent.name,
              confirmationStatus: 'NONE',
              slots: {
                [slotName]: {
                  confirmationStatus: 'NONE',
                  name: slotName,
                  resolutions: {},
                  value: '',
                },
                [slotName2]: {
                  confirmationStatus: 'NONE',
                  name: slotName2,
                  resolutions: {},
                  value: '',
                },
              },
            },
          },
        ],
      ]);
    });

    it('request type not intent', () => {
      const utils = {
        commandHandler: { canHandle: () => false },
        repeatHandler: { canHandle: () => false },
        addRepromptIfExists: sinon.stub(),
      };

      const captureHandler = CaptureV2Handler(utils as any);

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

        const captureHandler = CaptureV2Handler(utils as any);

        const node = { id: 'node-id' };
        const runtime = { turn: { get: sinon.stub().returns({ type: RequestType.INTENT }) } };
        const variables = { foo: 'bar' };

        expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(output);
        expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
        expect(utils.commandHandler.handle.args).to.eql([[runtime, variables]]);
      });

      describe('command cant handle', () => {
        it('local scope', () => {
          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: { handle: sinon.stub().returns('no-match-path') },
            repeatHandler: { canHandle: () => false },
          };

          const captureHandler = CaptureV2Handler(utils as any);

          const node = { nextId: 'next-id', intent: {}, intentScope: BaseNode.Utils.IntentScope.NODE };
          const request = { type: RequestType.INTENT, payload: { intent: { name: 'random', slots: [] } } };
          const runtime = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };

          expect(captureHandler.handle(node as any, runtime as any, {} as any, null as any)).to.eql('no-match-path');
          expect(utils.commandHandler.canHandle.callCount).to.eql(0);
        });

        it('no match', () => {
          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: { handle: sinon.stub().returns('no-match-path') },
            repeatHandler: { canHandle: () => false },
          };

          const captureHandler = CaptureV2Handler(utils as any);

          const node = { nextId: 'next-id', intent: {} };
          const request = { type: RequestType.INTENT, payload: { intent: { name: 'random', slots: [] } } };
          const runtime = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { foo: 'bar' };

          expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(
            'no-match-path'
          );
          expect(utils.noMatchHandler.handle.args).to.eql([[node, runtime, variables]]);
        });

        it('no match with node.intent', () => {
          const nodeID = 'node-id';
          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            noMatchHandler: { handle: sinon.stub().returns(nodeID) },
            repeatHandler: { canHandle: () => false },
          };

          const captureHandler = CaptureV2Handler(utils as any);

          const slotName = 'slot1';
          const node = { id: nodeID, nextId: 'next-id', intent: { name: 'intent-name', entities: [slotName] } };
          const request = { type: RequestType.INTENT, payload: { intent: {} } };
          const runtime = { turn: { get: sinon.stub().returns(request), set: sinon.stub(), delete: sinon.stub() } };
          const variables = { foo: 'bar' };

          expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(nodeID);
          expect(utils.noMatchHandler.handle.args).to.eql([[node, runtime, variables]]);
          expect(runtime.turn.set.args).to.eql([
            [
              T.DELEGATE,
              {
                name: node.intent.name,
                confirmationStatus: 'NONE',
                slots: {
                  [slotName]: {
                    confirmationStatus: 'NONE',
                    name: slotName,
                    resolutions: {},
                    value: '',
                  },
                },
              },
            ],
          ]);
        });

        describe('match intent', () => {
          it('query variable', () => {
            const utils = {
              commandHandler: {
                canHandle: sinon.stub().returns(false),
              },
              repeatHandler: { canHandle: sinon.stub().returns(false) },
            };

            const captureHandler = CaptureV2Handler(utils as any);

            const slotID = 'slot1';
            const node = { nextId: 'next-id', intent: { name: 'intent-name', entities: [slotID] }, variable: 'var1' };
            const request = {
              type: RequestType.INTENT,
              payload: {
                intent: { name: 'intent-name', slots: { [slotID]: { name: 'slot-name', value: 'slot-value' } } },
              },
            };
            const runtime = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
            const variables = { set: sinon.stub() };

            expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(
              node.nextId
            );
            expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
            expect(variables.set.args).to.eql([['var1', 'slot-value']]);
          });
        });

        it('maps intent slots', () => {
          const utils = {
            commandHandler: {
              canHandle: sinon.stub().returns(false),
            },
            repeatHandler: { canHandle: sinon.stub().returns(false) },
          };

          const captureHandler = CaptureV2Handler(utils as any);

          const slotID = 'slot_one';
          const slotID2 = 'slot_two';
          const slotID3 = 'slot_three';
          const node = { nextId: 'next-id', intent: { name: 'intent-name', entities: [slotID, slotID2] } };
          const request = {
            type: RequestType.INTENT,
            payload: {
              intent: {
                name: 'intent-name',
                slots: {
                  [slotID]: { name: 'slot-name', value: 'slot-value' },
                  [slotID3]: { name: 'slot-name3', value: 'slot-value3' },
                },
              },
            },
          };
          const runtime = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
          const variables = { merge: sinon.stub() };

          expect(captureHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.nextId);
          expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
          expect(variables.merge.args).to.eql([[{ [slotID]: 'slot-value' }]]);
        });
      });
    });
  });
});
