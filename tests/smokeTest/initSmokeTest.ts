/* eslint-disable no-console */
import execa from 'execa';
import path from 'path';

const TEST_RUNNER = path.resolve(__dirname, 'smokeTestRunner.ts');

(async () => {
  try {
    const cmd = await execa('ts-node', ['--files', '-r', 'tsconfig-paths/register', TEST_RUNNER], {
      preferLocal: true,
      stdio: 'inherit',
    });

    console.log('======= EXECA ENV STD =======');
    console.log('EXECA STDOUT: ', cmd.stdout);
    console.log('EXECA STDIN: ', cmd.stderr);
  } catch (err) {
    console.log('EXECA ERR: ', err);
  }
})();
