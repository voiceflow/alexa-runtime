import { interfaces } from 'ask-sdk-model';

import { AbstractManager } from '../utils';
import { NewContextRaw, OldContextRaw } from './types';
import { stackAdapter, storageAdapter, variablesAdapter } from './utils';

/**
 * Adapter to transform old vf-server sessions into the new format
 * The intention is to remove this adapter once we switch all users over
 */
class AdapterManager extends AbstractManager {
  async context(state: OldContextRaw, system: interfaces.system.SystemState): Promise<NewContextRaw | {}> {
    try {
      return {
        stack: stackAdapter(state),
        storage: storageAdapter(state),
        variables: variablesAdapter(state, system), // todo: better way to pass around this system obj
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('context adapter err: ', err.message);
      return {};
    }
  }
}

export default AdapterManager;
