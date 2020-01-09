import { Config } from '@/types';

import { FullServiceMap } from '../services';

// eslint-disable-next-line import/prefer-default-export
export abstract class AbstractMiddleware {
  constructor(public services: FullServiceMap, public config: Config) {}
}
