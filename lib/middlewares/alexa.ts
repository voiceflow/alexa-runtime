import verifier from 'alexa-verifier-middleware';
import { NextFunction, Request, Response } from 'express';

import { AbstractMiddleware } from './utils';

class AlexaMiddleware extends AbstractMiddleware {
  verifier(request: Request, response: Response, next: NextFunction) {
    return verifier(request, response, next);
  }
}

export default AlexaMiddleware;
