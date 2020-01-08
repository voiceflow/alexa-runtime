import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

import ExampleRouter from './routers/example';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/health', (_, res) => res.send('Healthy'));
  router.use('/example', ExampleRouter(middlewares, controllers));

  return router;
};
