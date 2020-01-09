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

  @validate({ PARAMS_ID: AlexaController.VALIDATIONS.PARAMS.versionID })
  async handler(req: Request<{ versionID: string }>) {
    const { alexaManager } = this.services;

    return alexaManager.handler(req.params.versionID, req.body);
  }
}

export default AlexaController;
