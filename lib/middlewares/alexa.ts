import verifier from 'alexa-verifier';
import { NextFunction, Request, Response } from 'express';

import log from '@/logger';
import { Config } from '@/types';

import { FullServiceMap } from '../services';
import { AbstractMiddleware } from './utils';

export const AlexaVerifierMiddleware = (req: Request & { _body: any; rawBody: any }, res: Response, next: NextFunction) => {
  if (req._body) {
    const er = 'The raw request body has already been parsed.';
    res.status(400).json({ status: 'failure', reason: er });
    return;
  }

  // TODO: if _rawBody is set and a string, don't obliterate it here!

  // mark the request body as already having been parsed so it's ignored by
  // other body parser middlewares
  req._body = true;
  req.rawBody = '';
  req.on('data', (data: string) => {
    // eslint-disable-next-line no-return-assign
    return (req.rawBody += data);
  });

  req.on('end', () => {
    try {
      req.body = JSON.parse(req.rawBody);
    } catch (parseError) {
      log.error(`body parse rejection: ${parseError}, ${req.rawBody}`);
      req.body = {};
    }

    const certUrl = req.headers.signaturecertchainurl as string;
    const signature = req.headers.signature as string;

    // eslint-disable-next-line no-shadow
    verifier(certUrl, signature, req.rawBody, (er) => {
      if (er) {
        log.error(`verifier failure: ${er}`);
        return res.status(400).json({ status: 'failure', reason: er });
      }
      return next();
    });
  });
};

class AlexaMiddleware extends AbstractMiddleware {
  public verifier: any;

  constructor(public services: FullServiceMap, public config: Config) {
    super(services, config);

    this.verifier = this.config.NODE_ENV === 'test' ? (_: any, __: any, next: () => void) => next() : AlexaVerifierMiddleware;
  }
}

export default AlexaMiddleware;
