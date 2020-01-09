import verifier from 'alexa-verifier-middleware';

import { router } from '../utils';
import { AbstractMiddleware } from './utils';

@router
class AlexaMiddleware extends AbstractMiddleware {
  verifier = verifier;
}

export default AlexaMiddleware;
