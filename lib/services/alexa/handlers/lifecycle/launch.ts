import { Context } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';

const context = async (context: Context, input: HandlerInput): Promise<void> => {
  // fetch the metadata for this version (project)
  const meta = await context.fetchMetadata();
};

export default context;
