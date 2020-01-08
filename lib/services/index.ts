import ExampleManager from './exampleManager';
import { AbstractManager } from './utils';

export { AbstractManager };
// ORDER BY DEPENDENCY

export interface ServiceMap {
  exampleManager: ExampleManager;
}

export default {
  ExampleManager,
};
