import { State } from '@voiceflow/client';

import { AbstractController } from './utils';

class TestController extends AbstractController {
  handler = async (req: { body: State }, res: { json: (object: object) => void }) => {
    const data = await this.services.test.invoke(req.body);

    res.json(data);

    return data;
  };
}

export default TestController;
