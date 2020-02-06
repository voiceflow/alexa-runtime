import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.test' });

chai.use(chaiAsPromised);
