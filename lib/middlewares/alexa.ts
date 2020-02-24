import verifier from 'alexa-verifier-middleware';

import { AbstractMiddleware } from './utils';

class AlexaMiddleware extends AbstractMiddleware {
  verifier = process.env.NODE_ENV === 'test' ? (_: any, __: any, next: () => void) => next() : verifier;
}

export default AlexaMiddleware;
