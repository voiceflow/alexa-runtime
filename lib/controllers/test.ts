import { State } from '@voiceflow/runtime';

import { AbstractController } from './utils';

class TestController extends AbstractController {
  async handler(req: { body: { state: State; request?: any } }) {
    const { test, metrics } = this.services;

    metrics.testRequest();

    return test.invoke(req.body.state, req.body.request);
  }
}

export default TestController;
