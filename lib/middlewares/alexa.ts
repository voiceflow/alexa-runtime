import AlexaVerifier from 'alexa-verifier-middleware';

import { Config } from '@/types';

import { FullServiceMap } from '../services';
import { AbstractMiddleware } from './utils';

class AlexaMiddleware extends AbstractMiddleware {
  public verifier: any;

  constructor(public services: FullServiceMap, public config: Config) {
    super(services, config);

    this.verifier = this.config.NODE_ENV === 'test' ? (_: any, __: any, next: () => void) => next() : AlexaVerifier;
  }
}

export default AlexaMiddleware;
