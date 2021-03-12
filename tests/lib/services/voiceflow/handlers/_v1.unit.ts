import { expect } from 'chai';
import sinon from 'sinon';

import { _V1Handler } from '@/lib/services/runtime/handlers/_v1';

describe('Trace handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(_V1Handler({} as any).canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
      expect(_V1Handler({} as any).canHandle({ _v: 2 } as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(_V1Handler({} as any).canHandle({ _v: 1 } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no default path', () => {
      const handler = _V1Handler();
      const nextID = 'next-id';

      const node = { paths: [{ nextID }], payload: { foo: 'bar' }, type: 'trace' };

      const runtime = { trace: { addTrace: sinon.stub() } };

      expect(handler.handle(node as any, runtime as any, null as any, null as any)).to.eql(nextID);
      expect(runtime.trace.addTrace.args).to.eql([[{ type: node.type, payload: { data: node.payload, paths: node.paths } }]]);
    });

    it('wrong default path', () => {
      const handler = _V1Handler();
      const nextID = 'next-id';

      const node = { paths: [{ nextID }], payload: { foo: 'bar' }, type: 'trace', defaultPath: 3 };

      const runtime = { trace: { addTrace: sinon.stub() } };

      expect(handler.handle(node as any, runtime as any, null as any, null as any)).to.eql(null);
      expect(runtime.trace.addTrace.args).to.eql([[{ type: node.type, payload: { data: node.payload, paths: node.paths } }]]);
    });

    it('no paths', () => {
      const handler = _V1Handler();

      const node = { payload: { foo: 'bar' }, type: 'trace', paths: [] };

      const runtime = { trace: { addTrace: sinon.stub() } };

      expect(handler.handle(node as any, runtime as any, null as any, null as any)).to.eql(null);
      expect(runtime.trace.addTrace.args).to.eql([[{ type: node.type, payload: { data: node.payload, paths: [] } }]]);
    });

    it('with default path', () => {
      const handler = _V1Handler();
      const nextID = 'next-id';

      const node = { paths: [{}, { nextID }], payload: { foo: 'bar' }, type: 'trace', defaultPath: 1 };

      const runtime = { trace: { addTrace: sinon.stub() } };

      expect(handler.handle(node as any, runtime as any, null as any, null as any)).to.eql(nextID);
      expect(runtime.trace.addTrace.args).to.eql([[{ type: node.type, payload: { data: node.payload, paths: node.paths } }]]);
    });
  });
});
