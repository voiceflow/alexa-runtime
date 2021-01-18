import { expect } from 'chai';
import sinon from 'sinon';

import { F, T } from '@/lib/constants';
import DefaultCommandHandler, { CommandHandler, getCommand } from '@/lib/services/runtime/handlers/command';
import { IntentName, RequestType } from '@/lib/services/runtime/types';

describe('command handler unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('getCommand', () => {
    it('no request', () => {
      const context = { turn: { get: sinon.stub().returns(null) } };
      expect(getCommand(context as any, null as any)).to.eql(null);
    });

    it('request type not intent', () => {
      const context = { turn: { get: sinon.stub().returns({ type: 'random type' }) } };
      expect(getCommand(context as any, null as any)).to.eql(null);
    });

    describe('request type intent', () => {
      it('VoiceFlowIntent', () => {
        const context = { turn: { get: sinon.stub().returns({ type: RequestType.INTENT, payload: { intent: { name: IntentName.VOICEFLOW } } }) } };
        expect(getCommand(context as any, null as any)).to.eql(null);
      });

      describe('intent cancel', () => {
        it('found', () => {
          const some = sinon.stub().returns(true);
          const context = {
            stack: { getFrames: sinon.stub().returns({ some }) },
            turn: { get: sinon.stub().returns({ type: RequestType.INTENT, payload: { intent: { name: IntentName.CANCEL } } }) },
          };
          const extraFrameCommand = sinon.stub().returns(null);

          expect(getCommand(context as any, extraFrameCommand as any)).to.eql(null);
          expect(context.stack.getFrames.callCount).to.eql(1);
          expect(some.callCount).to.eql(1);
          // assert some callback
          const fn = some.args[0][0];

          const some2 = sinon.stub();
          const frame = { getCommands: sinon.stub().returns({ some: some2 }) };
          fn(frame);
          expect(frame.getCommands.callCount).to.eql(1);
          expect(typeof some2.args[0][0]).to.eql('function');
        });

        it('not found', () => {
          const request = { type: RequestType.INTENT, payload: { intent: { name: IntentName.CANCEL } } };
          const context = {
            stack: { getFrames: sinon.stub().returns({ some: sinon.stub().returns(false) }) },
            turn: { set: sinon.stub(), get: sinon.stub().returns(request) },
          };
          const extraFrameCommand = sinon.stub().returns(null);

          expect(getCommand(context as any, extraFrameCommand as any)).to.eql(null);
          expect(request.payload.intent.name).to.eql(IntentName.STOP);
          expect(context.turn.set.args).to.eql([[T.REQUEST, request]]);
        });
      });

      it('no extracted frame', () => {
        const context = {
          stack: { foo: 'bar' },
          turn: { get: sinon.stub().returns({ type: RequestType.INTENT, payload: { intent: { name: 'random_intent' } } }) },
        };
        const extraFrameCommand = sinon.stub().returns(null);

        expect(getCommand(context as any, extraFrameCommand as any)).to.eql(null);
        expect(extraFrameCommand.args[0][0]).to.eql(context.stack);

        // assert matcher
        const matcher = extraFrameCommand.args[0][1];
        expect(typeof matcher).to.eql('function');
        expect(matcher(null)).to.eql(false);
        expect(matcher({ intent: 'other' })).to.eql(false);
        expect(matcher({ intent: 'random_intent' })).to.eql(true);
      });

      it('with extracted frame', () => {
        const payload = { intent: { name: 'random_intent', slots: ['slot1', 'slot2'] } };
        const context = {
          stack: { foo: 'bar' },
          turn: { get: sinon.stub().returns({ type: RequestType.INTENT, payload }) },
        };
        const frame = { random: '123' };
        const extraFrameCommand = sinon.stub().returns(frame);

        expect(getCommand(context as any, extraFrameCommand as any)).to.eql({ ...frame, intent: payload.intent });
      });
    });
  });

  describe('canHandle', () => {
    it('false', () => {
      expect(CommandHandler({ getCommand: sinon.stub().returns(null) } as any).canHandle(null as any)).to.eql(false);
    });
    it('true', () => {
      expect(CommandHandler({ getCommand: sinon.stub().returns({ foo: 'bar' }) } as any).canHandle(null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no command obj', () => {
      const commandHandler = CommandHandler({ getCommand: sinon.stub().returns(null) } as any);

      expect(commandHandler.handle(null as any, null as any)).to.eql(null);
    });

    it('no command', () => {
      const commandHandler = CommandHandler({ getCommand: sinon.stub().returns({}) } as any);

      const context = { turn: { delete: sinon.stub() } };

      expect(commandHandler.handle(context as any, null as any)).to.eql(null);
      expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
    });

    describe('has command', () => {
      it('no diagram_id or next', () => {
        const commandHandler = CommandHandler({ getCommand: sinon.stub().returns({ command: {} }) } as any);

        const context = { turn: { delete: sinon.stub() } };

        expect(commandHandler.handle(context as any, null as any)).to.eql(null);
      });

      it('mappings but no slots', () => {
        const commandHandler = CommandHandler({ getCommand: sinon.stub().returns({ command: { mappings: {} }, intent: {} }) } as any);

        const context = { turn: { delete: sinon.stub() } };

        expect(commandHandler.handle(context as any, null as any)).to.eql(null);
      });

      it('slots but no mappings', () => {
        const commandHandler = CommandHandler({ getCommand: sinon.stub().returns({ command: { intent: { slots: {} } } }) } as any);

        const context = { turn: { delete: sinon.stub() } };

        expect(commandHandler.handle(context as any, null as any)).to.eql(null);
      });

      it('mappings and slots', () => {
        const mappedSlots = { foo: 'bar' };
        const res = { intent: { slots: { slot1: 'slot_one' } }, command: { mappings: { mapping1: 'mapping1' } } };
        const utils = {
          mapSlots: sinon.stub().returns(mappedSlots),
          getCommand: sinon.stub().returns(res),
        };

        const commandHandler = CommandHandler(utils as any);

        const context = { turn: { delete: sinon.stub() } };
        const variables = { merge: sinon.stub() };

        expect(commandHandler.handle(context as any, variables as any)).to.eql(null);
        expect(utils.mapSlots.args).to.eql([[res.command.mappings, res.intent.slots]]);
        expect(variables.merge.args).to.eql([[mappedSlots]]);
      });

      it('diagram_id', () => {
        const res = { command: { diagram_id: 'diagram-id', intent: 'intent' } };
        const utils = { getCommand: sinon.stub().returns(res), Frame: sinon.stub() };

        const commandHandler = CommandHandler(utils as any);

        const topFrame = { storage: { set: sinon.stub() } };
        const context = {
          trace: { debug: sinon.stub() },
          stack: { push: sinon.stub(), top: sinon.stub().returns(topFrame) },
          turn: { delete: sinon.stub() },
        };

        expect(commandHandler.handle(context as any, null as any)).to.eql(null);
        expect(context.trace.debug.args).to.eql([[`matched command **${res.command.intent}** - adding command flow`]]);
        expect(topFrame.storage.set.args).to.eql([[F.CALLED_COMMAND, true]]);
        expect(utils.Frame.args).to.eql([[{ programID: res.command.diagram_id }]]);
        expect(context.stack.push.args).to.eql([[{}]]);
      });

      describe('next', () => {
        it('last frame in stack', () => {
          const stackSize = 3;

          const res = { command: { next: 'next-id', intent: 'intent' }, index: stackSize - 1 };
          const utils = { getCommand: sinon.stub().returns(res) };
          const commandHandler = CommandHandler(utils as any);

          const context = {
            trace: { debug: sinon.stub() },
            turn: { delete: sinon.stub() },
            stack: { getSize: sinon.stub().returns(stackSize) },
          };

          expect(commandHandler.handle(context as any, null as any)).to.eql(res.command.next);
          expect(context.trace.debug.args).to.eql([[`matched intent **${res.command.intent}** - jumping to node`]]);
        });

        it('not last frame', () => {
          const index = 1;
          const res = { command: { next: 'next-id', intent: 'intent' }, index };
          const utils = { getCommand: sinon.stub().returns(res) };
          const commandHandler = CommandHandler(utils as any);

          const topFrame = { setNodeID: sinon.stub() };
          const context = {
            trace: { debug: sinon.stub() },
            turn: { delete: sinon.stub() },
            stack: { getSize: sinon.stub().returns(3), top: sinon.stub().returns(topFrame), popTo: sinon.stub() },
          };

          expect(commandHandler.handle(context as any, null as any)).to.eql(null);
          expect(context.stack.popTo.args).to.eql([[index + 1]]);
          expect(topFrame.setNodeID.args).to.eql([[res.command.next]]);
          expect(context.trace.debug.args).to.eql([[`matched intent **${res.command.intent}** - exiting flows and jumping to node`]]);
        });

        it('index bigger than stack size', () => {
          const res = { command: { next: 'next-id' }, index: 4 };
          const utils = { getCommand: sinon.stub().returns(res) };
          const commandHandler = CommandHandler(utils as any);

          const context = {
            turn: { delete: sinon.stub() },
            stack: { getSize: sinon.stub().returns(3) },
          };

          expect(commandHandler.handle(context as any, null as any)).to.eql(null);
        });
      });
    });
  });

  describe('generation', () => {
    it('works correctly', () => {
      const context = { turn: { get: sinon.stub().returns(null) }, storage: { get: sinon.stub().returns(null) } };
      expect(DefaultCommandHandler().canHandle(context as any)).to.eql(false);
    });
  });
});
