import { expect } from 'chai';

import { MemoryPersistenceAdapter } from '@/lib/services/alexa/local';

describe('alexa local utils unit tests', () => {
  const USER_ID = 'user-id';
  const generateRequestEnvelope = (userId = USER_ID) => ({ context: { System: { user: { userId } } } } as any);

  describe('MemoryPersistenceAdapter', () => {
    it('getAttributes', async () => {
      const adapter = new MemoryPersistenceAdapter();
      expect(await adapter.getAttributes(generateRequestEnvelope())).to.eql({});

      adapter.table[USER_ID] = 'test';
      adapter.table.other = 'otherdata';
      expect(await adapter.getAttributes(generateRequestEnvelope())).to.eql('test');
      expect(await adapter.getAttributes(generateRequestEnvelope('other'))).to.eql('otherdata');
    });

    it('saveAttributes', async () => {
      const adapter = new MemoryPersistenceAdapter();

      await adapter.saveAttributes(generateRequestEnvelope(), 'foo' as any);
      expect(adapter.table).to.eql({ [USER_ID]: 'foo' });
    });

    it('deleteAttributes', async () => {
      const adapter = new MemoryPersistenceAdapter();

      adapter.table[USER_ID] = 'test';
      await adapter.deleteAttributes(generateRequestEnvelope());
      expect(adapter.table).to.eql({});
    });

    it('works', async () => {
      const adapter = new MemoryPersistenceAdapter();

      await adapter.saveAttributes(generateRequestEnvelope(), 'foo' as any);
      expect(await adapter.getAttributes(generateRequestEnvelope())).to.eql('foo');
      await adapter.deleteAttributes(generateRequestEnvelope());
      expect(await adapter.getAttributes(generateRequestEnvelope())).to.eql({});
    });
  });
});
