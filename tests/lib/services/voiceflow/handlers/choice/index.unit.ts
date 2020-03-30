/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import ChoiceHandler, { ChoiceHandlerGenerator } from '@/lib/services/voiceflow/handlers/choice';
import { RequestType } from '@/lib/services/voiceflow/types';

describe('choice handler unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('canHandle', () => {
    it('false', async () => {
      const block = {};

      const result = ChoiceHandler.canHandle(block as any, null as any, null as any, null as any);

      expect(result).to.eql(false);
    });

    it('true', async () => {
      const block = { choices: { foo: 'bar' } };

      const result = ChoiceHandler.canHandle(block as any, null as any, null as any, null as any);

      expect(result).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no request', () => {
      const utils = {
        addRepromptIfExists: sinon.stub(),
      };
      const choiceHandler = ChoiceHandlerGenerator(utils as any);

      const block = { blockID: 'block-id', inputs: [['one'], ['two']] };
      const context = { trace: { choice: sinon.stub() }, turn: { get: sinon.stub().returns(null) } };
      const variables = { var: '1' };

      expect(choiceHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.blockID);
      expect(utils.addRepromptIfExists.args).to.eql([[block, context, variables]]);
      expect(context.trace.choice.args[0][0]).to.eql([{ name: 'one' }, { name: 'two' }]);
    });

    it('request is not intent', () => {
      const utils = {
        addRepromptIfExists: sinon.stub(),
      };
      const choiceHandler = ChoiceHandlerGenerator(utils as any);

      const block = { blockID: 'block-id', inputs: [] };
      const context = { trace: { choice: sinon.stub() }, turn: { get: sinon.stub().returns({ type: 'random-type' }) } };
      const variables = { var: '1' };

      expect(choiceHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.blockID);
      expect(utils.addRepromptIfExists.args).to.eql([[block, context, variables]]);
      expect(context.trace.choice.args).to.eql([[[]]]);
    });

    describe('request type is intent', () => {
      it('no input', () => {
        const utils = {
          CommandHandler: {
            canHandle: sinon.stub().returns(false),
          },
        };
        const choiceHandler = ChoiceHandlerGenerator(utils as any);

        const block = {
          blockID: 'block-id',
          inputs: [
            ['no', 'nah'],
            ['yes', 'yeah'],
          ],
        };
        const request = {
          type: RequestType.INTENT,
          payload: {},
        };
        const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
        const variables = { var: '1' };

        expect(choiceHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(null);
        expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
      });

      it('has score', () => {
        const resultChoice = { index: 1, value: 'yes' };
        const utils = {
          getBestScore: sinon.stub().returns(resultChoice),
        };
        const choiceHandler = ChoiceHandlerGenerator(utils as any);

        const block = {
          blockID: 'block-id',
          nextIds: ['one', 'two', 'three'],
          inputs: [
            ['no', 'nah'],
            ['yes', 'yeah'],
          ],
        };
        const request = {
          type: RequestType.INTENT,
          payload: { input: 'yup' },
        };
        const context = { trace: { debug: sinon.stub() }, turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
        const variables = { var: '1' };

        expect(choiceHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.nextIds[1]);
        expect(utils.getBestScore.args).to.eql([
          [
            request.payload.input,
            [
              {
                index: 0,
                value: 'no',
              },
              {
                index: 0,
                value: 'nah',
              },
              {
                index: 1,
                value: 'yes',
              },
              {
                index: 1,
                value: 'yeah',
              },
            ],
          ],
        ]);
        expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
        expect(context.trace.debug.args).to.eql([[`matched choice **${resultChoice.value}** - taking path ${resultChoice.index + 1}`]]);
      });

      describe('no score', () => {
        it('command can handle', () => {
          const output = 'random-id';

          const utils = {
            getBestScore: sinon.stub().returns(null),
            CommandHandler: {
              canHandle: sinon.stub().returns(true),
              handle: sinon.stub().returns(output),
            },
          };
          const choiceHandler = ChoiceHandlerGenerator(utils as any);

          const block = {
            blockID: 'block-id',
            inputs: [
              ['no', 'nah'],
              ['yes', 'yeah'],
            ],
          };
          const request = {
            type: RequestType.INTENT,
            payload: { input: 'yup' },
          };
          const context = { turn: { get: sinon.stub().returns(request) } };
          const variables = { var: '1' };

          expect(choiceHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(output);
          expect(utils.CommandHandler.canHandle.args).to.eql([[context]]);
          expect(utils.CommandHandler.handle.args).to.eql([[context, variables]]);
        });

        describe('command cannot handle', () => {
          it('with elseId', () => {
            const utils = {
              getBestScore: sinon.stub().returns(null),
              CommandHandler: {
                canHandle: sinon.stub().returns(false),
              },
            };
            const choiceHandler = ChoiceHandlerGenerator(utils as any);

            const block = {
              blockID: 'block-id',
              elseId: 'else-id',
              inputs: [
                ['no', 'nah'],
                ['yes', 'yeah'],
              ],
            };
            const request = {
              type: RequestType.INTENT,
              payload: { input: 'yup' },
            };
            const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
            const variables = { var: '1' };

            expect(choiceHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.elseId);
            expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
          });

          it('without elseId', () => {
            const utils = {
              getBestScore: sinon.stub().returns(null),
              CommandHandler: {
                canHandle: sinon.stub().returns(false),
              },
            };
            const choiceHandler = ChoiceHandlerGenerator(utils as any);

            const block = {
              blockID: 'block-id',
              inputs: [
                ['no', 'nah'],
                ['yes', 'yeah'],
              ],
            };
            const request = {
              type: RequestType.INTENT,
              payload: { input: 'yup' },
            };
            const context = { turn: { get: sinon.stub().returns(request), delete: sinon.stub() } };
            const variables = { var: '1' };

            expect(choiceHandler.handle(block as any, context as any, variables as any, null as any)).to.eql(null);
            expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
          });
        });
      });
    });
  });
});
