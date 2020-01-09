import Client from '@voiceflow/client';

import { Config } from '@/types';

import Handlers from './handlers';

const Voiceflow = (_, config: Config) =>
  new Client({
    secret: config.VF_DATA_SECRET,
    handlers: Handlers,
  });

export default Voiceflow;
