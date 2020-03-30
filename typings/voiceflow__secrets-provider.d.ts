declare module '@voiceflow/secrets-provider' {
  import { Config } from '@/types';

  export interface SecretsProvider {
    start(config: { SECRETS_PROVIDER: string }): Promise<void>;
    get(name: string): string;
    stop(): Promise<void>;
  }

  const secretsProvider: SecretsProvider;

  export default secretsProvider;
}
