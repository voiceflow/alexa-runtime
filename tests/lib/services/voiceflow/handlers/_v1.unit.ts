import { expect } from 'chai';

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

      expect(handler.handle(node as any, null as any, null as any, null as any)).to.eql(nextID);
    });

    it('wrong default path', () => {
      const handler = _V1Handler();
      const nextID = 'next-id';

      const node = { paths: [{ nextID }], payload: { foo: 'bar' }, type: 'trace', defaultPath: 3 };

      expect(handler.handle(node as any, null as any, null as any, null as any)).to.eql(null);
    });

    it('no paths', () => {
      const handler = _V1Handler();

      const node = { payload: { foo: 'bar' }, type: 'trace', paths: [] };

      expect(handler.handle(node as any, null as any, null as any, null as any)).to.eql(null);
    });

    it('with default path', () => {
      const handler = _V1Handler();
      const nextID = 'next-id';

      const node = { paths: [{}, { nextID }], payload: { foo: 'bar' }, type: 'trace', defaultPath: 1 };

      expect(handler.handle(node as any, null as any, null as any, null as any)).to.eql(nextID);
    });
  });
});
