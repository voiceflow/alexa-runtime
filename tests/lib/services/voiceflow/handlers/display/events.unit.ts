import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import { stateDidExecute } from '@/lib/services/runtime/handlers/display/events';

describe('display handler events unit tests', () => {
  describe('stateDidExecute', () => {
    it('no displayInfo', () => {
      const context = { storage: { get: sinon.stub().returns(null) } };
      stateDidExecute({ context, variables: null } as any);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('with displayInfo', () => {
      const displayInfo = {
        dataSourceVariables: ['var1', 'var2'],
        lastVariables: {
          var1: 'one',
          var2: 'three',
          var3: 'random1', // not in dataSourceVariables
        },
      };
      const context = { storage: { get: sinon.stub().returns(displayInfo), produce: sinon.stub() } };
      const variables = {
        getState: sinon.stub().returns({
          var1: 'one',
          var2: 'two',
          var4: 'random4', // not in dataSourceVariables
        }),
      };
      stateDidExecute({ context, variables } as any);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
      expect(context.storage.produce.callCount).to.eql(1);

      // assert produce callback
      const produceCallback = context.storage.produce.args[0][0];
      const state = { [S.DISPLAY_INFO]: { shouldUpdate: false } };
      produceCallback(state);
      expect(state[S.DISPLAY_INFO].shouldUpdate).to.eql(true);
    });
  });
});
