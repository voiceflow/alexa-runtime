import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

import AlexaRouter from './routers/alexa';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.get('/health', (_, res) => res.send(`${process.env.NODE_ENV} Healthy`));
  router.use('/state/skill', AlexaRouter(middlewares, controllers));

  // Remove this once the alexa-runtime is no longer being used for the redirect
  // to the adapter/general-runtime
  router.use('/state/skill-internal', AlexaRouter(middlewares, controllers));

  return router;
};
