import Client from '@voiceflow/client';

import { Config } from '@/types';

import { ServiceMap } from '..';
import handlers from './handlers';

const Voiceflow = (_services: ServiceMap, config: Config) =>
  new Client({
    secret: config.VF_DATA_SECRET,
    endpoint: config.VF_DATA_ENDPOINT,
    handlers,
  });

export default Voiceflow;
