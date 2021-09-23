declare module '@voiceflow/backend-utils' {
  // eslint-disable-next-line import/no-extraneous-dependencies
  import { HttpStatus } from 'http-status';
  import { Request, Response, NextFunction } from 'express';
  import * as ExpressValidator from 'express-validator';

  type DataPromise = [] & {
    callback?: boolean;
    validations: Record<string, any>;
    validationsApplied?: boolean;
  };

  type AsyncMiddleware = (request: Request, response: Response, next: NextFunction) => Promise<void>;
  type Route = (...args: any[]) => Route | Route[] | AsyncMiddleware;

  // eslint-disable-next-line import/prefer-default-export
  export class ResponseBuilder {
    route(dataPromise: DataPromise, successCodeOverride?: HttpStatus, failureCodeOverride?: HttpStatus): Route;

    // eslint-disable-next-line @typescript-eslint/ban-types
    validationResult(req: Record<string, any>, res?: Record<string, any>, next?: Function): void;
  }

  export const Validator: typeof ExpressValidator;
}
