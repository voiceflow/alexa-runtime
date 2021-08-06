import { SkillRequestSignatureVerifier, TimestampVerifier } from 'ask-sdk-express-adapter';
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
      if (this.config.NODE_ENV === 'test') {
        return next();
      }

      // reference: https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/host-web-service.html#for-web-application-without-express-framework
      try {
        await new SkillRequestSignatureVerifier().verify(req.body, req.headers);
        await new TimestampVerifier().verify(req.body);
      } catch (err) {
        // server return err message
        log.error(`verifier failure: ${err}`);
        return res.status(400).json({ status: 'failure', reason: err });
      }

      try {
        req.body = JSON.parse(req.body);
      } catch (parseError) {
        log.error(`body parse rejection: ${parseError}, ${req.body}`);
        return res.status(400).json({ status: 'failure', reason: parseError });
      }

      return next();
    };
  }
}

export default AlexaMiddleware;
