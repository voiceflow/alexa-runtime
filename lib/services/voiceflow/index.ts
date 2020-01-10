import Client from '@voiceflow/client';
import DefaultHandlers from '@voiceflow/handlers';

import { Config } from '@/types';

import Handlers from './handlers';
import { ServiceMap } from '..';

const Voiceflow = (_services: ServiceMap, config: Config) =>
  new Client({
    secret: config.VF_DATA_SECRET,
    handlers: [...DefaultHandlers, ...Handlers],
  });

export default Voiceflow;
