declare module 'alexa-verifier' {
  function verifier(certUrl: string, signature: string, rawBody: string, cb: (er: any) => void): void;

  export default verifier;
}
