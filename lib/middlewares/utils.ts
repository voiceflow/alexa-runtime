import { Config } from '@/types';

import { FullServiceMap } from '../services';

export abstract class AbstractMiddleware {
  constructor(public services: FullServiceMap, public config: Config) {}
}
