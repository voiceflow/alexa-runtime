import { FixtureGenerator } from '@voiceflow/backend-utils';

import { ServiceManager } from '../../backend';
import config from '../../config';

const createFixture = async () => {
  const serviceManager = new ServiceManager(config);

  return FixtureGenerator.createFixture(serviceManager);
};

export default {
  createFixture,
  checkFixture: FixtureGenerator.checkFixture,
};
