import { NextFunction, Request, Response } from 'express';

import log from '@/logger';
import { Config } from '@/types';

import { FullServiceMap } from '../services';
import { AbstractMiddleware } from './utils';

class AlexaMiddleware extends AbstractMiddleware {
  public verifier: any;

  constructor(public services: FullServiceMap, public config: Config) {
    super(services, config);

    this.verifier = async (req: Request, res: Response, next: NextFunction) => {
      const plainTextBody: string = req.body;

      try {
        req.body = JSON.parse(req.body);
      } catch (error) {
        log.debug(`[http] [${this.constructor.name}] failed to parse JSON from body ${log.vars({ body: req.body, error })}`);
        return res.status(400).json({ status: 'failure', reason: error.message });
      }

      if (this.config.NODE_ENV === 'test') {
        return next();
      }

      // reference: https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/host-web-service.html#for-web-application-without-express-framework
      // source: https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/blob/master/ask-sdk-express-adapter/lib/util/index.ts
      try {
        await Promise.all(
          this.services.alexaVerifiers.map(async (verifier) => {
            await verifier.verify(plainTextBody, req.headers);
          })
        );
      } catch (error) {
        log.debug(`[http] [${this.constructor.name}] request verification failed ${log.vars({ body: req.body, error })}`);
        return res.status(400).json({ status: 'failure', reason: error.message });
      }

      return next();
    };
  }
}

export default AlexaMiddleware;
