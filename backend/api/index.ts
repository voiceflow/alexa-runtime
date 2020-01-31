import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

import AlexaRouter from './routers/alexa';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/health', (_, res) => res.send('Healthy'));
  router.use('/', AlexaRouter(middlewares, controllers));

  return router;
};
