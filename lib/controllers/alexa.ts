import { Validator } from '@voiceflow/backend-utils';

import { AlexaContext } from '@/lib/services/alexa/types';
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

    return alexa.skill.invoke(req.body, alexaContext);
  }

  async test() {
    console.log('start');
    await new Promise<void>((resolve, _reject) =>
      setTimeout(() => {
        console.log('setTimeout');
        resolve();
      }, 20000)
    );
    console.log('after');
    return 'hello';
  }
}

export default AlexaController;
