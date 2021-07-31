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

    // eslint-disable-next-line no-console
    console.log(req.body.request);
    const response = await alexa.skill.invoke(req.body, alexaContext);
    // eslint-disable-next-line no-console
    console.log(response.response);

    return response;
  }
}

export default AlexaController;
