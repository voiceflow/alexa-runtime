import { HandlerInput } from 'ask-sdk';
import _ from 'lodash';

import log from '@/logger';

import { AbstractManager } from '../utils';
import { NewStateRaw, OldStateRaw } from './types';
import { afterStorageModifier, beforeContextModifier, stackAdapter, storageAdapter, variablesAdapter } from './utils';

/**
 * Adapter to transform old vf-server sessions into the new format
 * The intention is to remove this adapter once we switch all users over
 */
class AdapterManager extends AbstractManager {
  async state(input: HandlerInput) {
    // getPersistentAttributes hits dynamo only once during a TURN. the results from dynamo are cached
    // and used for sequent calls to getPersistentAttributes
    const state = await input.attributesManager.getPersistentAttributes();

    if (!_.isEmpty(state) && !state.stack) {
      const transformedContext = await this.transformState(state as OldStateRaw, input);

      // set transformed context
      input.attributesManager.setPersistentAttributes(transformedContext);
    }
  }

  async transformState(state: OldStateRaw, input: HandlerInput): Promise<NewStateRaw | {}> {
    try {
      state = beforeContextModifier(state);

      const stack = stackAdapter(state);
      const variables = variablesAdapter(state, { system: input.requestEnvelope.context.System });
      let storage = storageAdapter(state, { accessToken: input.requestEnvelope.context.System.user.accessToken });

      storage = afterStorageModifier(storage, variables);

      return {
        stack,
        storage,
        variables,
      };
    } catch (err) {
      log.error('context adapter err: ', err.message);
      return {};
    }
  }
}

export default AdapterManager;
