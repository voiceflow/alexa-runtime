'use strict';

import express from 'express';
import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/:id', middlewares.example.checkExample, controllers.example.getExample);

  return router;
};
