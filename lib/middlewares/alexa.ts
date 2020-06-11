/* eslint-disable no-console */
import alexaVerifier from 'alexa-verifier';
import { RequestHandler } from 'express';

import { AbstractMiddleware } from './utils';

class AlexaMiddleware extends AbstractMiddleware {
  verifier: RequestHandler = (req: any, res, next) => {
    if (this.config.NODE_ENV === 'test') {
      return next();
    }

    if (req._body) {
      const er = 'The raw request body has already been parsed.';
      console.error(er);
      return res.status(400).json({ status: 'failure', reason: er });
    }

    // TODO: if _rawBody is set and a string, don't obliterate it here!

    // mark the request body as already having been parsed so it's ignored by
    // other body parser middlewares
    req._body = true;
    req.rawBody = '';
    req.on('data', (data: any) => {
      // eslint-disable-next-line no-return-assign
      return (req.rawBody += data);
    });

    req.on('end', () => {
      try {
        req.body = JSON.parse(req.rawBody);
      } catch (error) {
        req.body = {};
        console.error(`failed to parse body: ${req.rawBody}`);
      }

      const certUrl = req.headers.signaturecertchainurl;
      const { signature } = req.headers;

      alexaVerifier(certUrl, signature, req.rawBody, (err) => {
        if (err) {
          console.error(err.stack || err);
          console.error(`error with: ${req.rawBody}`);

          return res.status(400).json({
            status: 'failure',
            reason: err,
          });
        }
        return next();
      });
    });
  };
}

export default AlexaMiddleware;
