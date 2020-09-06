import { Validator } from '@voiceflow/backend-utils';

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
    const { alexa, voiceflow, metrics, dataAPI } = this.services;

    metrics.request();

    return alexa.skill.invoke(req.body, { versionID: req.params.versionID, voiceflow: voiceflow.client, api: dataAPI });
  }
}

export default AlexaController;
