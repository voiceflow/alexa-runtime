declare module 'alexa-verifier-middleware' {
  import { Request, Response, NextFunction } from 'express';

  function verifier(request: Request, response: Response, next: NextFunction): void;

  export default verifier;
}
