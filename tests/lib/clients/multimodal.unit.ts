import { expect } from 'chai';
import sinon from 'sinon';

import MultimodalClient from '@/lib/clients/multimodal';

describe('multimodal client unit tests', () => {
  describe('getDisplayDocument', () => {
    it('negative display id', async () => {
      const multimodal = MultimodalClient(null as any);
      expect(await multimodal.getDisplayDocument(-1)).to.eql(null);
    });

    it('no data', async () => {
      const serverDataApi = { fetchDisplayById: sinon.stub().resolves(null) };
      const multimodal = MultimodalClient(serverDataApi as any);

      const displayId = 1;
      expect(await multimodal.getDisplayDocument(displayId)).to.eql(null);
      expect(serverDataApi.fetchDisplayById.args).to.eql([[displayId]]);
    });

    it('no document', async () => {
      const serverDataApi = { fetchDisplayById: sinon.stub().resolves({}) };
      const multimodal = MultimodalClient(serverDataApi as any);

      const displayId = 1;
      expect(await multimodal.getDisplayDocument(displayId)).to.eql(null);
      expect(serverDataApi.fetchDisplayById.args).to.eql([[displayId]]);
    });

    it('with document', async () => {
      const document = { foo: 'bar' };
      const serverDataApi = { fetchDisplayById: sinon.stub().resolves({ document: JSON.stringify(document) }) };
      const multimodal = MultimodalClient(serverDataApi as any);

      const displayId = 1;
      expect(await multimodal.getDisplayDocument(displayId)).to.eql(document);
      expect(serverDataApi.fetchDisplayById.args).to.eql([[displayId]]);
    });

    it('error', async () => {
      const serverDataApi = { fetchDisplayById: sinon.stub().throws('error') };
      const multimodal = MultimodalClient(serverDataApi as any);

      const displayId = 1;
      expect(await multimodal.getDisplayDocument(displayId)).to.eql(null);
      expect(serverDataApi.fetchDisplayById.args).to.eql([[displayId]]);
    });
  });
});
