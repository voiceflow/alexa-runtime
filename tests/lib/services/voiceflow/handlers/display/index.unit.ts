import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import { APL_INTERFACE_NAME, ENDED_EVENT_PREFIX, EVENT_SEND_EVENT } from '@/lib/services/voiceflow/handlers/display/constants';
import DefaultDisplayHandler, { DisplayHandler, getVariables } from '@/lib/services/voiceflow/handlers/display/index';

describe('displayHandler.unit tests', () => {
  const displayHandler = DefaultDisplayHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(displayHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(displayHandler.canHandle({ display_id: 'id' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('supportedInterfaces is null', async () => {
      const context = { storage: { get: sinon.stub().returns(null) }, variables: { getState: sinon.stub().returns(null) } };
      expect(await displayHandler.handle({} as any, context as any, null as any, null as any)).to.eql(null);
    });

    it('supportedInterfaces does not have APL_INTERFACE_NAME', async () => {
      const context = { storage: { get: sinon.stub().returns({}) }, variables: { getState: sinon.stub().returns(null) } };
      const nextId = 'next-id';
      expect(await displayHandler.handle({ nextId } as any, context as any, null as any, null as any)).to.eql(nextId);
    });

    it('no document', async () => {
      const context = {
        storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
        variables: { getState: sinon.stub().returns(null) },
        services: { multimodal: { getDisplayDocument: sinon.stub().returns(null) } },
      };
      const node = { display_id: 'display-id', apl_commands: 'commands', datasource: '{hello} there, {name}' };
      expect(await displayHandler.handle(node as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.storage.set.args).to.eql([
        [
          S.DISPLAY_INFO,
          {
            playingVideos: {},
            commands: undefined,
            dataSource: node.datasource,
            shouldUpdate: true,
            currentDisplay: node.display_id,
            dataSourceVariables: ['hello', 'name'],
          },
        ],
      ]);
      expect(context.services.multimodal.getDisplayDocument.args).to.eql([[node.display_id]]);
    });

    it('valid json command', async () => {
      const context = {
        storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
        variables: { getState: sinon.stub().returns(null) },
        services: { multimodal: { getDisplayDocument: sinon.stub().returns(null) } },
      };
      const rawCommand = ['a', 'b'];
      const node = { display_id: 'display-id', apl_commands: JSON.stringify(rawCommand), datasource: '{hello} there, {name}' };
      expect(await displayHandler.handle(node as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.storage.set.args).to.eql([
        [
          S.DISPLAY_INFO,
          {
            playingVideos: {},
            commands: rawCommand,
            dataSource: node.datasource,
            shouldUpdate: true,
            currentDisplay: node.display_id,
            dataSourceVariables: ['hello', 'name'],
          },
        ],
      ]);
      expect(context.services.multimodal.getDisplayDocument.args).to.eql([[node.display_id]]);
    });

    it('undefined command', async () => {
      const context = {
        storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
        variables: { getState: sinon.stub().returns(null) },
        services: { multimodal: { getDisplayDocument: sinon.stub().returns(null) } },
      };

      const node = { display_id: 'display-id', datasource: '{hello} there, {name}' };
      expect(await displayHandler.handle(node as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.storage.set.args).to.eql([
        [
          S.DISPLAY_INFO,
          {
            commands: undefined,
            playingVideos: {},
            dataSource: node.datasource,
            shouldUpdate: true,
            currentDisplay: node.display_id,
            dataSourceVariables: ['hello', 'name'],
          },
        ],
      ]);
      expect(context.services.multimodal.getDisplayDocument.args).to.eql([[node.display_id]]);
    });

    describe('with document', () => {
      it('no hasOnEndEvent', async () => {
        const results = {};
        const utils = { deepFindVideos: sinon.stub().returns(results), getVariables };
        const handler = DisplayHandler(utils as any);

        const document = 'document';
        const context = {
          storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
          variables: { getState: sinon.stub().returns(null) },
          services: { multimodal: { getDisplayDocument: sinon.stub().returns(document) } },
        };
        const node = { display_id: 'display-id', apl_commands: 'commands', datasource: 'random' };
        expect(await handler.handle(node as any, context as any, null as any, null as any)).to.eql(null);
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
        const handler = DisplayHandler(utils as any);

        const document = 'document';
        const setNodeID = sinon.stub();
        const context = {
          end: sinon.stub(),
          stack: { top: sinon.stub().returns({ setNodeID }) },
          storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
          variables: { getState: sinon.stub().returns(null) },
          services: { multimodal: { getDisplayDocument: sinon.stub().returns(document) } },
        };
        const node = { display_id: 'display-id', apl_commands: 'commands', nextId: 'next-id' };
        expect(await handler.handle(node as any, context as any, null as any, null as any)).to.eql(null);
        expect(setNodeID.args).to.eql([[node.nextId]]);
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
        const handler = DisplayHandler(utils as any);

        const document = 'document';
        const setNodeID = sinon.stub();
        const context = {
          end: sinon.stub(),
          stack: { top: sinon.stub().returns({ setNodeID }) },
          storage: { set: sinon.stub(), get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }) },
          variables: { getState: sinon.stub().returns(null) },
          services: { multimodal: { getDisplayDocument: sinon.stub().returns(document) } },
        };
        const node = { display_id: 'display-id', apl_commands: 'commands' };
        expect(await handler.handle(node as any, context as any, null as any, null as any)).to.eql(null);
        expect(setNodeID.args).to.eql([[null]]);
        expect(context.end.callCount).to.eql(1);
      });
    });
  });
});
