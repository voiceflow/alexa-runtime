import Client, { Context, State } from '@voiceflow/runtime';
import { HandlerInput } from 'ask-sdk';

// eslint-disable-next-line import/prefer-default-export
export const updateContext = async (input: HandlerInput, produce: (context: Context) => Promise<void> | void) => {
  const { versionID, voiceflow } = input.context as { versionID: string; voiceflow: Client };
  const rawState = await input.attributesManager.getPersistentAttributes();

  const context = voiceflow.createContext(versionID, rawState as State);
  await produce(context);

  input.attributesManager.setPersistentAttributes(context.getRawState());
};
