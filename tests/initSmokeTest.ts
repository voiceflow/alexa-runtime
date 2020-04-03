/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import execa from 'execa';
import fs from 'fs';
import path from 'path';

const SESSION_PREFIX = 'session-recording';
const RECORDINGS_FOLDER = path.resolve(__dirname, 'recordedSessions');
const TEST_RUNNER = path.resolve(__dirname, 'smokeTestRunner.ts');

// eslint-disable-next-line promise/catch-or-return
fs.promises.readdir(RECORDINGS_FOLDER).then(async (files) => {
  // eslint-disable-next-line no-restricted-syntax, promise/always-return
  for (const file of files) {
    if (typeof file !== 'string' || !file.startsWith(SESSION_PREFIX)) {
      continue;
    }

    const filePath = path.resolve(RECORDINGS_FOLDER, file);

    console.log(`running test for session: ${file}`);

    const cmd = await execa('ts-node', ['--files', '-r', 'tsconfig-paths/register', TEST_RUNNER, '-f', filePath], {
      preferLocal: true,
      stdio: 'inherit',
    });

    console.log(cmd.stdout);
    console.error(cmd.stderr);

    await Promise.resolve(filePath);
  }
});
