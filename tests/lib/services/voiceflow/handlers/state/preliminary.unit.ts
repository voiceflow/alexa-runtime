import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import { PreliminaryHandler as PreliminaryHandlerFactory } from '@/lib/services/runtime/handlers/state/preliminary';

describe('preliminary handler unit tests', () => {
  describe('canHandle', () => {
    it('not expected request', () => {
      const runtime = { turn: { get: sinon.stub().returns(null) } };
      expect(PreliminaryHandlerFactory({ eventHandlers: [] } as any).canHandle(null as any, runtime as any, null as any, null as any)).to.eql(false);
    });

    it('handler found', () => {
      const runtime = { turn: { get: sinon.stub().returns({ payload: { name: 'event1' } }) } };
      const eventHandlers = [{ canHandle: sinon.stub().returns(true) }];
      expect(PreliminaryHandlerFactory({ eventHandlers } as any).canHandle(null as any, runtime as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      const runtime = { turn: { get: sinon.stub().returns({ payload: { name: 'event1' } }) } };
      expect(PreliminaryHandlerFactory({ eventHandlers: [] } as any).canHandle(null as any, runtime as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('command can handle', () => {
      const nodeID = 'node-id';
      const utils = {
        commandHandler: { canHandle: sinon.stub().returns(true), handle: sinon.stub().returns(nodeID) },
      };
      const handler = PreliminaryHandlerFactory(utils as any);

      const runtime = { turn: { delete: sinon.stub() } };
      const variables = { var1: 'val1', var2: 'val2' };
      expect(handler.handle(null as any, runtime as any, variables as any, null as any)).to.eql(nodeID);
      expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
      expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
      expect(utils.commandHandler.handle.args).to.eql([[runtime, variables]]);
    });

    it('command cant handle', () => {
      const utils = {
        commandHandler: { canHandle: sinon.stub().returns(false) },
      };
      const handler = PreliminaryHandlerFactory(utils as any);

      const node = { id: 'id' };
      const runtime = { turn: { delete: sinon.stub() } };
      const variables = { var1: 'val1', var2: 'val2' };
      expect(handler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(runtime.turn.delete.args).to.eql([[T.REQUEST]]);
      expect(utils.commandHandler.canHandle.args).to.eql([[runtime]]);
    });
  });
});
