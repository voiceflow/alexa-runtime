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

    if (req.params.versionID === '63011b1d6a315b0008b360fb') {
      log.warn('incoming 63011b1d6a315b0008b360fb');
    }

    try {
      return await alexa.skill.invoke(req.body, alexaContext);
    } catch (error) {
      if (req.params.versionID === '63011b1d6a315b0008b360fb') {
        log.warn(`[error] ${error}`);
        // eslint-disable-next-line no-console
        console.error(error);
      }
      throw error;
    }
  }
}

export default AlexaController;
