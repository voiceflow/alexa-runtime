import { Config } from '@/types';

import { FullServiceMap } from '.';

// eslint-disable-next-line import/prefer-default-export
export abstract class AbstractManager {
  constructor(public services: FullServiceMap, public config?: Config) {}
}
