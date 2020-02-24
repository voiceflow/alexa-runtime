/* eslint-disable no-await-in-loop */
// import secretsProvider from '@voiceflow/secrets-provider';
import execa from 'execa';
import fs from 'fs';
import path from 'path';

// import { Client } from 'pg';
// import { SessionRecording } from './types';

const SESSION_PREFIX = 'session-recording';
const RECORDINGS_FOLDER = path.resolve(__dirname, 'recordedSessions');
const TEST_RUNNER = path.resolve(__dirname, 'smokeTestRunner.ts');

// eslint-disable-next-line promise/catch-or-return
fs.promises.readdir(RECORDINGS_FOLDER).then(async (files) => {
  // await secretsProvider.start({
  //   SECRETS_PROVIDER: 'test',
  // });

  // const dbConfig = secretsProvider.get('MAIN_DB');
  // const pgClient = new Client({
  //   host: dbConfig.host,
  //   user: dbConfig.username,
  //   password: dbConfig.password,
  //   database: dbConfig.dbname,
  //   port: dbConfig.port,
  // });

  // await pgClient.connect();

  // const seessionRecordings = files.filter((file) => file.startsWith(SESSION_PREFIX));

  // eslint-disable-next-line no-restricted-syntax, promise/always-return
  for (const file of files) {
    if (typeof file !== 'string' || !file.startsWith(SESSION_PREFIX)) {
      continue;
    }

    const filePath = path.resolve(RECORDINGS_FOLDER, file);
    // const rawRecording = await fs.promises.readFile(filePath, 'utf-8');
    // const recording: SessionRecording = JSON.parse(rawRecording);

    console.log(`running test for session: ${file}`);

    const cmd = await execa('ts-node', ['--files', '-r', 'tsconfig-paths/register', TEST_RUNNER, '-f', filePath], {
      preferLocal: true,
      stdio: 'inherit',
      env: {
        NODE_ENV: 'test',
        SECRETS_PROVIDER: 'test',
      },
    });

    console.log(cmd.stdout);
    console.error(cmd.stderr);

    await Promise.resolve(filePath);
  }
});
