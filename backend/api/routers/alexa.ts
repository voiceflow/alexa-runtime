import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/:versionID', middlewares.alexa.verifier, controllers.alexa.handler);

  return router;
};
