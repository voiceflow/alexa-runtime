import { HandlerInput } from 'ask-sdk';

import { AbstractManager } from '../utils';
import { NewContextRaw, OldContextRaw } from './types';
import { stackAdapter, storageAdapter, variablesAdapter } from './utils';

/**
 * Adapter to transform old vf-server sessions into the new format
 * The intention is to remove this adapter once we switch all users over
 */
class AdapterManager extends AbstractManager {
  // todo: better way to pass around this state & input obj
  async context(state: OldContextRaw, input: HandlerInput): Promise<NewContextRaw | {}> {
    try {
      return {
        stack: stackAdapter(state),
        storage: storageAdapter(state, input),
        variables: variablesAdapter(state, input.requestEnvelope.context.System),
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('context adapter err: ', err.message);
      return {};
    }
  }
}

export default AdapterManager;
