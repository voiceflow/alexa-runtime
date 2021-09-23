import execa from 'execa';
import path from 'path';

const TEST_RUNNER = path.resolve(__dirname, 'smokeTestRunner.ts');

(async () => {
  try {
    await execa('ts-node', ['--files', '-r', 'tsconfig-paths/register', TEST_RUNNER], {
      preferLocal: true,
      stdio: 'inherit',
    });
  } catch (err) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
})();
