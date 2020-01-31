import Client from '@voiceflow/client';

import { Config } from '@/types';

import { ServiceMap } from '..';
import handlers, { Block } from './handlers';

const Voiceflow = (_services: ServiceMap, config: Config) =>
  new Client<Block>({
    secret: config.VF_DATA_SECRET,
    endpoint: config.VF_DATA_ENDPOINT,
    handlers: handlers,
  });

export { Block };

export default Voiceflow;
