/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import Common from '@voiceflow/common';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import execa from 'execa';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: './.env.test' });

const SESSION_PREFIX = 'session-recording';
const RECORDINGS_FOLDER = path.resolve(__dirname, 'recordedSessions');
const TEST_RUNNER = path.resolve(__dirname, 'smokeTestRunner.ts');
const DYNAMO_SESSIONS_TABLE = 'test-runner-sessions';
const { getProcessEnv } = Common.utils.general;

AWS.config = new AWS.Config({
  accessKeyId: getProcessEnv('AWS_ACCESS_KEY_ID'),
  secretAccessKey: getProcessEnv('AWS_SECRET_ACCESS_KEY'),
  endpoint: getProcessEnv('AWS_ENDPOINT'),
  region: getProcessEnv('AWS_REGION'),
} as any);

const client = new AWS.DynamoDB();

const createTable = async () => {
  const params = {
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
  const liveParams = { ...params, TableName: DYNAMO_SESSIONS_TABLE };
  await client.createTable(liveParams).promise();
};

const deleteTable = async () => {
  await client.deleteTable({ TableName: DYNAMO_SESSIONS_TABLE }).promise();
};

fs.promises
  .readdir(RECORDINGS_FOLDER)
  .then(async (files) => {
    // eslint-disable-next-line no-restricted-syntax, promise/always-return
    for (const file of files) {
      if (typeof file !== 'string' || !file.startsWith(SESSION_PREFIX)) {
        continue;
      }

      await createTable();

      const filePath = path.resolve(RECORDINGS_FOLDER, file);

      console.log(`running test for session: ${file}`);

      const cmd = await execa('ts-node', ['--files', '-r', 'tsconfig-paths/register', TEST_RUNNER, '-f', filePath], {
        preferLocal: true,
        stdio: 'inherit',
      });

      console.log(cmd.stdout);
      console.error(cmd.stderr);

      await deleteTable();

      await Promise.resolve(filePath);
    }
  })
  .catch((err) => console.log(err));
