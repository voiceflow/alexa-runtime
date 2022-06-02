import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import {
  APL_INTERFACE_NAME,
  ENDED_EVENT_PREFIX,
  EVENT_SEND_EVENT,
} from '@/lib/services/runtime/handlers/display/constants';
import { DisplayHandler } from '@/lib/services/runtime/handlers/displayV2/index';

describe('displayV2 unit tests', () => {
  describe('canHandle', () => {
    it('works with document and datasource truthy', () => {
      const node = { document: 'abcd', datasource: 'xyz' };
      const abc = DisplayHandler({} as any);
      expect(DisplayHandler({} as any).canHandle(node as any, null as any, null as any, null as any)).to.eql(true);
    });

    it('works with datasource only truthy', () => {
      const node = { document: '', datasource: 'xyz' };

      expect(DisplayHandler({} as any).canHandle(node as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('works with document and datasource falsy', () => {
      const node = { document: '', datasource: '' };

      expect(DisplayHandler({} as any).canHandle(node as any, null as any, null as any, null as any)).to.eql(false);
    });
  });

  describe('handle', () => {
    it('works if commandHandler can handle', async () => {
      const node = { nextId: 'nextId-val' } as any;
      const runtime = { storage: { get: sinon.stub().returns({ [APL_INTERFACE_NAME]: '' }) } } as any;
      const variables = { abc: 'def' } as any;
      const utils = {
        commandHandler: { canHandle: sinon.stub().returns(true), handle: sinon.stub().returns('commandHandle-ret') },
      } as any;

      expect(await DisplayHandler(utils).handle(node, runtime, variables, null as any)).to.eql('commandHandle-ret');
      expect(runtime.storage.get.args).to.eql([[S.SUPPORTED_INTERFACES]]);
      expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
      expect(utils.commandHandler.handle.args).to.eql([[runtime, variables]]);
    });

    it('works if commandHandler cant handle and supportedInterfaces doesnt have APL_INTERFACE_NAME', async () => {
      const node = { nextId: 'nextId-val' } as any;
      const runtime = { storage: { get: sinon.stub().returns({ [APL_INTERFACE_NAME]: undefined }) } } as any;
      const variables = { abc: 'def' } as any;
      const utils = {
        commandHandler: { canHandle: sinon.stub().returns(false), handle: sinon.stub().returns('commandHandle-ret') },
      } as any;

      expect(await DisplayHandler(utils).handle(node, runtime, variables, null as any)).to.eql('nextId-val');
      expect(runtime.storage.get.args).to.eql([[S.SUPPORTED_INTERFACES]]);
      expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
      expect(utils.commandHandler.handle.args).to.eql([]);
    });

    it('works if commandHandler cant handle and supportedInterfaces is undefined', async () => {
      const node = { nextId: 'nextId-val' } as any;
      const runtime = { storage: { get: sinon.stub().returns(undefined) } } as any;
      const variables = { abc: 'def' } as any;
      const utils = {
        commandHandler: { canHandle: sinon.stub().returns(false), handle: sinon.stub().returns('commandHandle-ret') },
      } as any;

      expect(await DisplayHandler(utils).handle(node, runtime, variables, null as any)).to.eql('nextId-val');
      expect(runtime.storage.get.args).to.eql([[S.SUPPORTED_INTERFACES]]);
      expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
      expect(utils.commandHandler.handle.args).to.eql([]);
    });

    it('works if has onEndEvent', async () => {
      const node = {
        nextId: 'nextId-val',
        aplCommands: 'aplCommands-val',
        document: 'document-val',
        datasource: 'datasource-val',
      } as any;
      const topReturnObj = { setNodeID: sinon.stub() };
      const runtime = {
        end: sinon.stub(),
        stack: { top: sinon.stub().returns(topReturnObj) },
        storage: { get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }), set: sinon.stub() },
      } as any;
      const variables = { abc: 'def', getState: sinon.stub().returns('getState-val') } as any;
      const onEndEvents = [
        { item: { onEnd: { type: EVENT_SEND_EVENT, arguments: [ENDED_EVENT_PREFIX] } } },
        { item: {} },
      ];
      const utils = {
        getVariables: sinon.stub().returns('getVariables-val'),
        deepFindVideos: sinon.stub().returns(onEndEvents),
        replaceVariables: sinon
          .stub()
          .returns('{"key":"value"}')
          .onSecondCall()
          .returns('{"key":"value2"}'),
        commandHandler: { canHandle: sinon.stub().returns(false), handle: sinon.stub().returns('commandHandle-ret') },
      } as any;

      expect(await DisplayHandler(utils).handle(node, runtime, variables, null as any)).to.eql(null);
      expect(runtime.storage.get.args).to.eql([[S.SUPPORTED_INTERFACES]]);
      expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
      expect(utils.replaceVariables.args).to.eql([
        ['aplCommands-val', 'getState-val'],
        ['document-val', 'getState-val'],
      ]);
      expect(runtime.storage.set.args).to.eql([
        [
          S.DISPLAY_INFO,
          {
            commands: { key: 'value' },
            dataSource: 'datasource-val',
            document: 'document-val',
            playingVideos: {},
            shouldUpdate: true,
            dataSourceVariables: 'getVariables-val',
          },
        ],
      ]);
      expect(utils.getVariables.args).to.eql([['datasource-val']]);
      expect(utils.deepFindVideos.args).to.eql([[{ key: 'value2' }]]);
      expect(runtime.stack.top.args).to.eql([[]]);
      expect(topReturnObj.setNodeID.args).to.eql([['nextId-val']]);
      expect(runtime.end.args).to.eql([[]]);
    });

    it('works if has onEndEvent and does empty value cases', async () => {
      const node = { aplCommands: 'aplCommands-val', document: 'document-val' } as any;
      const topReturnObj = { setNodeID: sinon.stub() };
      const runtime = {
        end: sinon.stub(),
        stack: { top: sinon.stub().returns(topReturnObj) },
        storage: { get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }), set: sinon.stub() },
      } as any;
      const variables = { abc: 'def', getState: sinon.stub().returns('getState-val') } as any;
      const onEndEvents = [
        { item: { onEnd: { type: EVENT_SEND_EVENT, arguments: [ENDED_EVENT_PREFIX] } } },
        { item: {} },
      ];
      const utils = {
        getVariables: sinon.stub().returns('getVariables-val'),
        deepFindVideos: sinon.stub().returns(onEndEvents),
        replaceVariables: sinon
          .stub()
          .returns('{"key":"value"}')
          .onSecondCall()
          .returns('{"key":"value2"}'),
        commandHandler: { canHandle: sinon.stub().returns(false), handle: sinon.stub().returns('commandHandle-ret') },
      } as any;

      expect(await DisplayHandler(utils).handle(node, runtime, variables, null as any)).to.eql(null);
      expect(runtime.storage.get.args).to.eql([[S.SUPPORTED_INTERFACES]]);
      expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
      expect(utils.replaceVariables.args).to.eql([
        ['aplCommands-val', 'getState-val'],
        ['document-val', 'getState-val'],
      ]);
      expect(runtime.storage.set.args).to.eql([
        [
          S.DISPLAY_INFO,
          {
            commands: { key: 'value' },
            dataSource: '',
            document: 'document-val',
            playingVideos: {},
            shouldUpdate: true,
            dataSourceVariables: 'getVariables-val',
          },
        ],
      ]);
      expect(utils.getVariables.args).to.eql([['']]);
      expect(utils.deepFindVideos.args).to.eql([[{ key: 'value2' }]]);
      expect(runtime.stack.top.args).to.eql([[]]);
      expect(topReturnObj.setNodeID.args).to.eql([[null]]);
      expect(runtime.end.args).to.eql([[]]);
    });

    it('works if has no onEndEvent', async () => {
      const node = {
        nextId: 'nextId-val',
        aplCommands: 'aplCommands-val',
        document: 'document-val',
        datasource: 'datasource-val',
      } as any;
      const topReturnObj = { setNodeID: sinon.stub() };
      const runtime = {
        end: sinon.stub(),
        stack: { top: sinon.stub().returns(topReturnObj) },
        storage: { get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }), set: sinon.stub() },
      } as any;
      const variables = { abc: 'def', getState: sinon.stub().returns('getState-val') } as any;
      const onEndEvents = [{ item: {} }];
      const utils = {
        getVariables: sinon.stub().returns('getVariables-val'),
        deepFindVideos: sinon.stub().returns(onEndEvents),
        replaceVariables: sinon
          .stub()
          .returns('{"key":"value"}')
          .onSecondCall()
          .returns('{"key":"value2"}'),
        commandHandler: { canHandle: sinon.stub().returns(false), handle: sinon.stub().returns('commandHandle-ret') },
      } as any;

      expect(await DisplayHandler(utils).handle(node, runtime, variables, null as any)).to.eql('nextId-val');
      expect(runtime.storage.get.args).to.eql([[S.SUPPORTED_INTERFACES]]);
      expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
      expect(utils.replaceVariables.args).to.eql([
        ['aplCommands-val', 'getState-val'],
        ['document-val', 'getState-val'],
      ]);
      expect(runtime.storage.set.args).to.eql([
        [
          S.DISPLAY_INFO,
          {
            commands: { key: 'value' },
            dataSource: 'datasource-val',
            document: 'document-val',
            playingVideos: {},
            shouldUpdate: true,
            dataSourceVariables: 'getVariables-val',
          },
        ],
      ]);
      expect(utils.getVariables.args).to.eql([['datasource-val']]);
      expect(utils.deepFindVideos.args).to.eql([[{ key: 'value2' }]]);
      expect(runtime.stack.top.args).to.eql([]);
      expect(topReturnObj.setNodeID.args).to.eql([]);
      expect(runtime.end.args).to.eql([]);
    });

    it('works if has no document', async () => {
      const node = {
        nextId: 'nextId-val',
        aplCommands: 'aplCommands-val',
        document: '',
        datasource: 'datasource-val',
      } as any;
      const topReturnObj = { setNodeID: sinon.stub() };
      const runtime = {
        end: sinon.stub(),
        stack: { top: sinon.stub().returns(topReturnObj) },
        storage: { get: sinon.stub().returns({ [APL_INTERFACE_NAME]: true }), set: sinon.stub() },
      } as any;
      const variables = { abc: 'def', getState: sinon.stub().returns('getState-val') } as any;
      const onEndEvents = [{ item: {} }];
      const utils = {
        getVariables: sinon.stub().returns('getVariables-val'),
        deepFindVideos: sinon.stub().returns(onEndEvents),
        replaceVariables: sinon
          .stub()
          .returns('{"key":"value"}')
          .onSecondCall()
          .returns('{"key":"value2"}'),
        commandHandler: { canHandle: sinon.stub().returns(false), handle: sinon.stub().returns('commandHandle-ret') },
      } as any;

      expect(await DisplayHandler(utils).handle(node, runtime, variables, null as any)).to.eql('nextId-val');
      expect(runtime.storage.get.args).to.eql([[S.SUPPORTED_INTERFACES]]);
      expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
      expect(utils.replaceVariables.args).to.eql([['aplCommands-val', 'getState-val']]);
      expect(runtime.storage.set.args).to.eql([]);
    });
  });
});
