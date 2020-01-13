import Client from '@voiceflow/client';

// import DefaultHandlers from '@voiceflow/handlers';
import { Config } from '@/types';

import { ServiceMap } from '..';
import Handlers from './handlers';

const Voiceflow = (_services: ServiceMap, config: Config) =>
  new Client({
    secret: config.VF_DATA_SECRET,
    endpoint: config.VF_DATA_ENDPOINT,
    handlers: [...Handlers],
  });

export default Voiceflow;
