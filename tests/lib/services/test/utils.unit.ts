import { expect } from 'chai';
import sinon from 'sinon';

import { addBlockTrace, addDebugTrace, addFlowTrace, addSpeakTrace, TraceType } from '@/lib/services/test/utils';

describe('test manager utils unit tests', () => {
  describe('addBlockTrace', () => {
    it('works correctly', () => {
      const context = { addTrace: sinon.stub() };
      const blockID = 'block-id';

      addBlockTrace(context as any, blockID);
      expect(context.addTrace.args).to.eql([
        [
          {
            type: TraceType.BLOCK,
            payload: { blockID },
          },
        ],
      ]);
    });
  });

  describe('addSpeakTrace', () => {
    it('works correctly', () => {
      const context = { addTrace: sinon.stub() };
      const message = 'message';

      addSpeakTrace(context as any, message);
      expect(context.addTrace.args).to.eql([
        [
          {
            type: TraceType.SPEAK,
            payload: { message },
          },
        ],
      ]);
    });
  });

  describe('addFlowTrace', () => {
    it('works correctly', () => {
      const context = { addTrace: sinon.stub() };
      const diagramID = 'diagram-id';

      addFlowTrace(context as any, diagramID);
      expect(context.addTrace.args).to.eql([
        [
          {
            type: TraceType.FLOW,
            payload: { diagramID },
          },
        ],
      ]);
    });
  });

  describe('addDebugTrace', () => {
    it('works correctly', () => {
      const context = { addTrace: sinon.stub() };
      const message = 'message';

      addDebugTrace(context as any, message);
      expect(context.addTrace.args).to.eql([
        [
          {
            type: TraceType.DEBUG,
            payload: { message },
          },
        ],
      ]);
    });
  });
});
