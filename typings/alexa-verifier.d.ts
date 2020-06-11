declare module 'alexa-verifier' {
  function verifier(cert_url: string, signature: string, requestBody: string, callback: (error: any) => void): void;

  export default verifier;
}
