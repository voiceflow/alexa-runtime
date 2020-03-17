import bodyParser from 'body-parser';
import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

export default (_: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.json());
  router.post('/', controllers.test.handler);

  return router;
};
