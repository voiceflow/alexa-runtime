import { Context, State } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';

// eslint-disable-next-line import/prefer-default-export
export const updateContext = async (input: HandlerInput, produce: (context: Context) => Promise<void> | void) => {
  const { versionID, voiceflow } = input.context;
  const rawState = await input.attributesManager.getPersistentAttributes();

  const context = voiceflow.createContext(versionID, rawState as State, null);
  await produce(context);

  input.attributesManager.setPersistentAttributes(context.getRawState());
};
