import Client from '@voiceflow/client';

import { Config } from '@/types';

import { ServiceMap } from '..';
import handlers from './handlers';

const Voiceflow = (services: ServiceMap, config: Config) =>
  new Client({
    secret: config.VF_DATA_SECRET,
    endpoint: config.VF_DATA_ENDPOINT,
    handlers,
    services,
  });

export default Voiceflow;
