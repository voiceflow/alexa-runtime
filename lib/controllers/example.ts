import VError from '@voiceflow/verror';
import { param } from 'express-validator';

import { Request } from '@/types';

import { router, validate } from '../utils';
import { AbstractController } from './utils';

@router
class ExampleController extends AbstractController {
  static VALIDATIONS = {
    PARAMS: {
      ID: param('id')
        .exists()
        .isInt(),
    },
  };

  @validate({ PARAMS_ID: ExampleController.VALIDATIONS.PARAMS.ID })
  async getExample(req: Request<{ id: number }>) {
    const { exampleManager } = this.services;

    /* 
        do some work here
    */
    if (req.params.id === 0) {
      throw new VError('Invalid request', VError.HTTP_STATUS.BAD_REQUEST);
    }

    return exampleManager.getExample(req.params.id);
  }
}

export default ExampleController;
