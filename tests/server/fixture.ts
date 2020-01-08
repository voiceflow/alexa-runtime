import { FixtureGenerator } from '@voiceflow/backend-utils';
import secretsProvider from '@voiceflow/secrets-provider';

import { ServiceManager } from '../../backend';
import config from '../../config';

const createFixture = async () => {
  await secretsProvider.start({
    SECRETS_PROVIDER: 'test',
  });
  const serviceManager = new ServiceManager(config);

  return FixtureGenerator.createFixture(serviceManager);
};

export default {
  createFixture,
  checkFixture: FixtureGenerator.checkFixture,
};
