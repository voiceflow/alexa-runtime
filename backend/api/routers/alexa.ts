import bodyParser from '@voiceflow/body-parser';
import express from 'express';

import { BODY_PARSER_SIZE_LIMIT } from '@/backend/constants';
import { ControllerMap, MiddlewareMap } from '@/lib';

export default (middlewares: MiddlewareMap, controllers: ControllerMap) => {
  const router = express.Router();

  router.use(bodyParser.text({ type: '*/*' }));
  router.use(middlewares.alexa.verifier);
  router.post('/:versionID', controllers.alexa.handler);

  return router;
};
