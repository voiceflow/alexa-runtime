import verifier from 'alexa-verifier-middleware';

import { router } from '../utils';
import { AbstractMiddleware } from './utils';

@router<AlexaMiddleware>(['verifier'])
class AlexaMiddleware extends AbstractMiddleware {
  verifier = verifier;
}

export default AlexaMiddleware;
