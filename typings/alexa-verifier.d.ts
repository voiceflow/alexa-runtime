declare module 'alexa-verifier' {
  function verifier(certUrl: string, signature: string, rawBody: string, callback: (er: any) => void): void;

  export default verifier;
}
