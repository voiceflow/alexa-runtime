import { EmptyObject } from '@voiceflow/common';

import { Config } from '@/types';

import { FullServiceMap } from '.';

export abstract class AbstractManager<T = EmptyObject> {
  public services: FullServiceMap & T;

  constructor(services: FullServiceMap, public config: Config) {
    this.services = services as FullServiceMap & T;
  }
}

export { Config, FullServiceMap as Services };
