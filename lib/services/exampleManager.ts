import { Example } from '../models';
import { AbstractManager } from './utils';

class ExampleManager extends AbstractManager {
  static CONSTANTS = {
    RANDOM: 1,
  };

  async getExample(id: number): Promise<Example> {
    /*
     do some work here
    */
    return { id };
  }
}

export default ExampleManager;
