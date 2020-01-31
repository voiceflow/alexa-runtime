import { param } from 'express-validator';

import { Request } from '@/types';

import { router, validate } from '../utils';
import { AbstractController } from './utils';

@router
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

    return alexa.invoke(req.body, { versionID: req.params.versionID, voiceflow });
  }
}

export default AlexaController;
