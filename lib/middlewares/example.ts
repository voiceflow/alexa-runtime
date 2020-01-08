import VError from '@voiceflow/verror';

import { Next, Request, Response } from '@/types';

import { router } from '../utils';
import { AbstractMiddleware } from './utils';

@router
class ExampleMiddleware extends AbstractMiddleware {
  async checkExample(req: Request, _: Response, next: Next) {
    if (!req.headers.token) {
      throw new VError('Token required', VError.HTTP_STATUS.UNAUTHORIZED);
    }

    return next();
  }
}

export default ExampleMiddleware;
