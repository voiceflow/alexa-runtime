import { createAskSdkError } from 'ask-sdk';
import { Verifier } from 'ask-sdk-express-adapter';
import { RequestEnvelope } from 'ask-sdk-model';

// eslint-disable-next-line import/prefer-default-export
export class AlexaUserIDVerifier implements Verifier {
  async verify(requestEnvelope: string): Promise<void> {
    const requestEnvelopeJson: RequestEnvelope = JSON.parse(requestEnvelope);
    if (requestEnvelopeJson?.context?.System?.user?.userId == null) {
      throw createAskSdkError(this.constructor.name, 'User ID not found in request envelope');
    }
  }
}
