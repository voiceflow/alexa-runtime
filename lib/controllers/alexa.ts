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
    log.info(`handling skill ${req.params.versionID}`);
    const { alexa, runtimeClient, metrics, dataAPI } = this.services;

    metrics.request();

    const alexaContext: AlexaContext = {
      api: dataAPI,
      versionID: req.params.versionID,
      runtimeClient,
    };

    return alexa.skill.invoke(req.body, alexaContext);
  }
}

export default AlexaController;
