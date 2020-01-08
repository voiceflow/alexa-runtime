import Knex from 'knex';

export default (dbConfig) => {
  return Knex({
    client: 'postgresql',
    connection: {
      user: dbConfig.username,
      host: dbConfig.host,
      database: dbConfig.dbname,
      password: dbConfig.password,
      port: dbConfig.port,
    },
    pool: {
      min: 1,
      max: 1,
    },
    migrations: {
      tableName: '_knex_migrations',
      directory: './migrations/voiceflow',
    },
  });
};
