import { Context, Request, State } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';

const context = async (input: HandlerInput, request: Request): Promise<Context> => {
  const { versionID, voiceflow } = input.context;
  const rawState = await input.attributesManager.getPersistentAttributes();

  return voiceflow.createContext(versionID, rawState as State, request);
};

export default context;
