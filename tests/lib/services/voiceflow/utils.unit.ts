import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import { addRepromptIfExists, mapSlots } from '@/lib/services/voiceflow/utils';

describe('voiceflow manager utils unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('addRepromptIfExists', () => {
    it('does not have repropmt', () => {
      const context = { turn: { set: sinon.stub() } };
      addRepromptIfExists({ foo: 'bar' } as any, context as any, null as any);

      expect(context.turn.set.callCount).to.eql(0);
    });

    it('has reprompt', () => {
      const context = { turn: { set: sinon.stub() } };
      const node = { reprompt: 'hello {var}' };
      const varState = { var: 'there' };
      const variables = { getState: sinon.stub().returns(varState) };

      addRepromptIfExists(node as any, context as any, variables as any);

      expect(context.turn.set.args[0]).to.eql([T.REPROMPT, 'hello there']);
    });
  });

  describe('mapSlots', () => {
    it('no mappings', () => {
      expect(mapSlots(null as any, { foo: 'bar' } as any)).to.eql({});
    });

    it('no slots', () => {
      expect(mapSlots({ foo: 'bar' } as any, null as any)).to.eql({});
    });

    it('no mappings and slots', () => {
      expect(mapSlots(null as any, null as any)).to.eql({});
    });

    it('works', () => {
      const mappings = [
        { slot: 'slotA', variable: 'var1' },
        {},
        { slot: 'slotB', variable: 'var2' },
        { slot: 'randomSlot', variable: 'var3' },
        { slot: 'slotC', variable: 'var4' },
      ];
      const slots = {
        slotA: { value: '1' },
        slotB: { value: 'value' },
        slotC: { resolutions: { resolutionsPerAuthority: [{ values: [{ value: { name: 'nested' } }] }] } },
      };

      expect(mapSlots(mappings as any, slots as any)).to.eql({ var1: 1, var2: 'value', var4: 'nested' });
    });
  });
});
