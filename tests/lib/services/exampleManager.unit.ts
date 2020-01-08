/* eslint-disable sonarjs/no-duplicate-string */

import { expect } from 'chai';
import sinon from 'sinon';

import ExampleManager from '@/lib/services/exampleManager';

describe('exampleManager unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('getExample', () => {
    it('returns correctly', async () => {
      const exampleManager = new ExampleManager({} as any, {} as any);

      const id = 12;
      expect(await exampleManager.getExample(id)).to.eql({ id: 12 });
    });
  });
});
