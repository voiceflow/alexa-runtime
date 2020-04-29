import secretsProvider from '@voiceflow/secrets-provider';
import HashidsClass from 'hashids';

const Hashids = () => new HashidsClass(secretsProvider.get('CONFIG_ID_HASH'), 10);

export type HashidsType = HashidsClass;

export default Hashids;
