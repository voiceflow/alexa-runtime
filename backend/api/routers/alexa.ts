import bodyParser from 'body-parser';
import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(middlewares.alexa.verifier);
  router.use(bodyParser.json());
  router.post('/:versionID', controllers.alexa.handler);

  return router;
};
