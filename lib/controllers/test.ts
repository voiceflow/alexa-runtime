import { State } from '@voiceflow/client';

import { AbstractController } from './utils';

class TestController extends AbstractController {
  handler = (req: { body: State }) => {
    return this.services.test.invoke(req.body);
  };
}

export default TestController;
