import { Validator } from '@voiceflow/backend-utils';

import { AlexaContext } from '@/lib/services/alexa/types';
import log from '@/logger';
import { Request } from '@/types';

import { validate } from '../utils';
import { AbstractController } from './utils';

const { param } = Validator;

class AlexaController extends AbstractController {
  static VALIDATIONS = {
    PARAMS: {
      versionID: param('versionID')
        .exists()
        .isString(),
    },
  };

  @validate({ VERSION_ID: AlexaController.VALIDATIONS.PARAMS.versionID })
  async handler(req: Request<{ versionID: string }>) {
    const { alexa, runtimeClient, metrics, dataAPI } = this.services;

    metrics.request();

    const alexaContext: AlexaContext = {
      api: dataAPI,
      versionID: req.params.versionID,
      runtimeClient,
    };

    if (req.params.versionID === '6041446c8f74b3001c175b5c') {
      log.warn('REQUEST 6041446c8f74b3001c175b5c request=%s', JSON.stringify(req.body.request));
    }

    const response = await alexa.skill.invoke(req.body, alexaContext);

    // temporary hard coded for debugging on prod
    if (req.params.versionID === '6041446c8f74b3001c175b5c') {
      log.warn('RESPONSE 6041446c8f74b3001c175b5c requestType=%s response=%s', req.body.request.type, JSON.stringify(response));
    }
    return response;
  }
}

export default AlexaController;
