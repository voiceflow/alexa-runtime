import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import { addRepromptIfExists, mapSlots } from '@/lib/services/runtime/utils';

const GlobalNoReply = { prompt: { voice: 'Alexa', content: 'Sorry, could not understand what you said' } };

describe('voiceflow manager utils unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('addRepromptIfExists', () => {
    it('does not have repropmt', () => {
      const runtime = { turn: { set: sinon.stub() } };
      addRepromptIfExists({ node: { foo: 'bar' } as any, runtime: runtime as any, variables: null as any });

      expect(runtime.turn.set.callCount).to.eql(0);
    });

    it('has reprompt', () => {
      const runtime = { turn: { set: sinon.stub() } };
      const node = { reprompt: 'hello {var}' };
      const varState = { var: 'there' };
      const variables = { getState: sinon.stub().returns(varState) };

      addRepromptIfExists({ node, runtime: runtime as any, variables: variables as any });

      expect(runtime.turn.set.args[0]).to.eql([T.REPROMPT, 'hello there']);
    });

    it('has global no-match and has reprompt', () => {
      const runtime = {
        turn: { set: sinon.stub() },
        version: {
          platformData: {
            settings: {
              globalNoReply: GlobalNoReply,
            },
          },
        },
      };
      const node = { reprompt: 'hello {var}' };
      const varState = { var: 'there' };
      const variables = { getState: sinon.stub().returns(varState) };

      addRepromptIfExists({ node, runtime: runtime as any, variables: variables as any });

      expect(runtime.turn.set.args[0]).to.eql([T.REPROMPT, 'hello there']);
    });

    it('has global no-match and has no reprompt', () => {
      const runtime = {
        turn: { set: sinon.stub() },
        version: {
          platformData: {
            settings: {
              globalNoReply: GlobalNoReply,
            },
          },
        },
      };

      const variables = { getState: sinon.stub() };

      addRepromptIfExists({ node: { foo: 'bar' } as any, runtime: runtime as any, variables: variables as any });

      expect(runtime.turn.set.args[0]).to.eql([T.REPROMPT, 'Sorry, could not understand what you said']);
    });
  });

  describe('mapSlots', () => {
    it('no mappings', () => {
      expect(mapSlots({ slots: { foo: 'bar' } as any, mappings: null as any })).to.eql({});
    });

    it('no slots', () => {
      expect(mapSlots({ slots: { foo: 'bar' } as any, mappings: null as any })).to.eql({});
    });

    it('no mappings and slots', () => {
      expect(mapSlots({ slots: null as any, mappings: null as any })).to.eql({});
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

      expect(mapSlots({ mappings: mappings as any, slots: slots as any })).to.eql({
        var1: 1,
        var2: 'value',
        var4: 'nested',
      });
    });
  });
});
