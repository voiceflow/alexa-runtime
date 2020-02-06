import verifier from 'alexa-verifier-middleware';

import { AbstractMiddleware } from './utils';

class AlexaMiddleware extends AbstractMiddleware {
  verifier = verifier;
}

export default AlexaMiddleware;
