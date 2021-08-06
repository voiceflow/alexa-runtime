import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.text({ type: '*/*' }));
  router.use(middlewares.alexa.verifier);
  // the middlewares.alexa.verifier does a JSON.parse on the body, req.body is an object now
  router.post('/:versionID', controllers.alexa.handler);

  return router;
};
