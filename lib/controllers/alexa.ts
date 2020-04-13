import { param } from 'express-validator';

import { Request } from '@/types';

import { validate } from '../utils';
import { AbstractController } from './utils';

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
    const { alexa, voiceflow } = this.services;

    return alexa.skill.invoke(req.body, { versionID: req.params.versionID, voiceflow: voiceflow.client });
  }
}

export default AlexaController;
