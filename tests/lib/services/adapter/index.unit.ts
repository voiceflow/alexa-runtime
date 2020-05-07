import { expect } from 'chai';
import sinon from 'sinon';

import AdapterManager from '@/lib/services/adapter';

import { newInteraction, oldInteraction } from './fixtures';

describe('adapterManager unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('context', () => {
    const tests = [{ text: 'wait on interaction', old: oldInteraction, new: newInteraction }];

    tests.forEach((test) => {
      it(test.text, async () => {
        const adapter = new AdapterManager(null as any, null as any);

        expect(await adapter.context(test.old as any)).to.deep.eq(test.new);
      });
    });
  });
});
