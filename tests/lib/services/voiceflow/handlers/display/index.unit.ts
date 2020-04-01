import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import { APL_INTERFACE_NAME, ENDED_EVENT_PREFIX, EVENT_SEND_EVENT } from '@/lib/services/voiceflow/handlers/display/constants';
import DisplayHandler, { DisplayHandlerGerator, getVariables } from '@/lib/services/voiceflow/handlers/display/index';

describe('DisplayHandler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(DisplayHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(DisplayHandler.canHandle({ display_id: 'id' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('supportedInterfaces is null', async () => {
      const context = { storage: { get: sinon.stub().returns(null) } };
      expect(await DisplayHandler.handle({} as any, context as any, null as any, null as any)).to.eql(null);
    });

    it('supportedInterfaces does not have APL_INTERFACE_NAME', async () => {
      const context = { storage: { get: sinon.stub().returns({}) } };
      const nextId = 'next-id';
      expect(await DisplayHandler.handle({ nextId } as any, context as any, null as any, null as any)).to.eql(nextId);
    });

    it('no document', async () => {
      const context = {
        storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
        services: { multimodal: { getDisplayDocument: sinon.stub().returns(null) } },
      };
      const block = { display_id: 'display-id', apl_commands: 'commands', datasource: '{hello} there, {name}' };
      expect(await DisplayHandler.handle(block as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.storage.set.args).to.eql([
        [
          S.DISPLAY_INFO,
          {
            playingVideos: {},
            commands: undefined,
            dataSource: block.datasource,
            shouldUpdate: true,
            currentDisplay: block.display_id,
            dataSourceVariables: ['hello', 'name'],
          },
        ],
      ]);
      expect(context.services.multimodal.getDisplayDocument.args).to.eql([[block.display_id]]);
    });

    it('valid json command', async () => {
      const context = {
        storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
        services: { multimodal: { getDisplayDocument: sinon.stub().returns(null) } },
      };
      const rawCommand = ['a', 'b'];
      const block = { display_id: 'display-id', apl_commands: JSON.stringify(rawCommand), datasource: '{hello} there, {name}' };
      expect(await DisplayHandler.handle(block as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.storage.set.args).to.eql([
        [
          S.DISPLAY_INFO,
          {
            playingVideos: {},
            commands: rawCommand,
            dataSource: block.datasource,
            shouldUpdate: true,
            currentDisplay: block.display_id,
            dataSourceVariables: ['hello', 'name'],
          },
        ],
      ]);
      expect(context.services.multimodal.getDisplayDocument.args).to.eql([[block.display_id]]);
    });

    it('undefined command', async () => {
      const context = {
        storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
        services: { multimodal: { getDisplayDocument: sinon.stub().returns(null) } },
      };

      const block = { display_id: 'display-id', datasource: '{hello} there, {name}' };
      expect(await DisplayHandler.handle(block as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.storage.set.args).to.eql([
        [
          S.DISPLAY_INFO,
          {
            commands: undefined,
            playingVideos: {},
            dataSource: block.datasource,
            shouldUpdate: true,
            currentDisplay: block.display_id,
            dataSourceVariables: ['hello', 'name'],
          },
        ],
      ]);
      expect(context.services.multimodal.getDisplayDocument.args).to.eql([[block.display_id]]);
    });

    describe('with document', () => {
      it('no hasOnEndEvent', async () => {
        const results = {};
        const utils = { deepFindVideos: sinon.stub().returns(results), getVariables };
        const handler = DisplayHandlerGerator(utils as any);

        const document = 'document';
        const context = {
          storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
          services: { multimodal: { getDisplayDocument: sinon.stub().returns(document) } },
        };
        const block = { display_id: 'display-id', apl_commands: 'commands', datasource: 'random' };
        expect(await handler.handle(block as any, context as any, null as any, null as any)).to.eql(null);
        expect(context.storage.set.args[0][1].dataSourceVariables).to.eql([]); // assert datasource with no variables in string
        expect(utils.deepFindVideos.args).to.eql([[document]]);
      });

      it('has hasOnEndEvent', async () => {
        const results = [
          {
            item: {
              onEnd: null,
            },
            path: 'string',
          },
          {
            item: {
              onEnd: {
                type: EVENT_SEND_EVENT,
                arguments: null, // no arguments
              },
            },
            path: 'string',
          },
          {
            item: {
              onEnd: {
                type: EVENT_SEND_EVENT,
                arguments: {}, // arguments not array
              },
            },
            path: 'string',
          },
          {
            item: {
              onEnd: {
                type: EVENT_SEND_EVENT,
                arguments: [ENDED_EVENT_PREFIX],
              },
            },
            path: 'string',
          },
        ];

        const utils = { deepFindVideos: sinon.stub().returns(results), getVariables: sinon.stub().returns('') };
        const handler = DisplayHandlerGerator(utils as any);

        const document = 'document';
        const setBlockID = sinon.stub();
        const context = {
          end: sinon.stub(),
          stack: { top: sinon.stub().returns({ setBlockID }) },
          storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
          services: { multimodal: { getDisplayDocument: sinon.stub().returns(document) } },
        };
        const block = { display_id: 'display-id', apl_commands: 'commands', nextId: 'next-id' };
        expect(await handler.handle(block as any, context as any, null as any, null as any)).to.eql(null);
        expect(setBlockID.args).to.eql([[block.nextId]]);
        expect(context.end.callCount).to.eql(1);
      });

      it('has hasOnEndEvent but no nextId', async () => {
        const results = [
          {
            item: {
              onEnd: {
                type: EVENT_SEND_EVENT,
                arguments: [ENDED_EVENT_PREFIX],
              },
            },
            path: 'string',
          },
        ];

        const utils = { deepFindVideos: sinon.stub().returns(results), getVariables: sinon.stub().returns('') };
        const handler = DisplayHandlerGerator(utils as any);

        const document = 'document';
        const setBlockID = sinon.stub();
        const context = {
          end: sinon.stub(),
          stack: { top: sinon.stub().returns({ setBlockID }) },
          storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
          services: { multimodal: { getDisplayDocument: sinon.stub().returns(document) } },
        };
        const block = { display_id: 'display-id', apl_commands: 'commands' };
        expect(await handler.handle(block as any, context as any, null as any, null as any)).to.eql(null);
        expect(setBlockID.args).to.eql([[null]]);
        expect(context.end.callCount).to.eql(1);
      });
    });
  });
});
