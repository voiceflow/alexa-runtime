import { HandlerInput } from 'ask-sdk';
import _ from 'lodash';

import { AbstractManager } from '../utils';
import { NewContextRaw, OldContextRaw } from './types';
import { afterStorageModifier, beforeContextModifier, stackAdapter, storageAdapter, variablesAdapter } from './utils';

/**
 * Adapter to transform old vf-server sessions into the new format
 * The intention is to remove this adapter once we switch all users over
 */
class AdapterManager extends AbstractManager {
  async context(input: HandlerInput) {
    // getPersistentAttributes hits dynamo only once during a TURN. the results from dynamo are cached
    // and used for sequent calls to getPersistentAttributes
    const context = await input.attributesManager.getPersistentAttributes();
    if (!_.isEmpty(context) && !context.stack) {
      const transformedContext = await this.transformContext(context as OldContextRaw, input);

      // set transformed context
      input.attributesManager.setPersistentAttributes(transformedContext);
    }
  }

  async transformContext(context: OldContextRaw, input: HandlerInput): Promise<NewContextRaw | {}> {
    try {
      beforeContextModifier(context);

      const stack = stackAdapter(context);
      const variables = variablesAdapter(context, { system: input.requestEnvelope.context.System });
      const storage = storageAdapter(context, { accessToken: input.requestEnvelope.context.System.user.accessToken });

      afterStorageModifier(storage, variables);

      return {
        stack,
        storage,
        variables,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('context adapter err: ', err.message);
      return {};
    }
  }
}

export default AdapterManager;
