import 'pluginSetup';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.test' });

chai.use(chaiAsPromised);
chai.use(deepEqualInAnyOrder);
