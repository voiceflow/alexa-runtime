import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

dotenv.config({ path: './.env.test' });

chai.use(chaiAsPromised);
