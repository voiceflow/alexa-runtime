declare module '@voiceflow/verror' {
  // eslint-disable-next-line import/no-extraneous-dependencies
  import HttpStatus from 'http-status';

  class VError extends Error {
    public name: string;

    public code: string;

    public data: any;

    public dateTime: Date;
  }

  export { HttpStatus as HTTP_STATUS };

  export default VError;
}
