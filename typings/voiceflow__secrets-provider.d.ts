declare module '@voiceflow/secrets-provider' {
  import { Config } from '@/types';

  interface DBConfig {
    username: string;
    host: string;
    dbname: string;
    password: string;
    port: number;
  }

  export interface SecretsProvider {
    start(config: { SECRETS_PROVIDER: string }): Promise<void>;
    get(name: string): DBConfig;
    stop(): Promise<void>;
  }

  const secretsProvider: SecretsProvider;

  export default secretsProvider;
}
