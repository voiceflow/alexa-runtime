import { State } from '@voiceflow/client';

import { AbstractController } from './utils';

class TestController extends AbstractController {
  handler = async (req: { body: { state: State; request?: any } }, res: { json: (object: object) => void }) => {
    const data = await this.services.test.invoke(req.body.state, req.body.request);

    res.json(data);

    return data;
  };
}

export default TestController;
