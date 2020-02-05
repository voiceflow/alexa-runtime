import { Context, Store } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import axios from 'axios';

import { Storage as S, Turn as T } from '@/lib/constants/flags';

import { Permission, PERMISSIONS, PRODUCT } from './constants';

const _alexaApiCall = (handlerInput: any, endpoint: string) => {
  const { apiEndpoint, authorizationValue } = handlerInput.serviceClientFactory.apiConfiguration;
  return axios.get(`${apiEndpoint}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${authorizationValue}`,
      'Accept-Language': handlerInput.requestEnvelope.request.locale,
      Host: handlerInput.requestEnvelope.context.System.apiEndpoint.substring(8),
    },
  });
};

const _ispPermission = async (handlerInput: HandlerInput): Promise<boolean> => {
  try {
    const voicePurchasingEndpoint = '/v1/users/~current/skills/~current/settings/voicePurchasing.enabled';
    const status = await _alexaApiCall(handlerInput, voicePurchasingEndpoint);
    return status.data === true;
  } catch (err) {
    return false;
  }
};

const _productPermission = async (
  handlerInput: HandlerInput,
  permission: Permission,
  permissionVariable: string | undefined,
  locale: string,
  variables: Store
): Promise<boolean> => {
  try {
    if (!permission?.product?.value) {
      return false;
    }

    const productValue = permission.product.value;

    const result = await handlerInput.serviceClientFactory?.getMonetizationServiceClient().getInSkillProduct(locale, productValue);

    // Kids ISP testing
    if (permission.transaction && permission.transaction.value) {
      if (result?.entitlementReason === PRODUCT.PURCHASED && result?.entitled === PRODUCT.ENTITLED) {
        variables.set(permission.transaction.value, PRODUCT.APPROVED_BY_PARENT);
      } else if (result?.entitlementReason === PRODUCT.AUTO_ENTITLED) {
        variables.set(permission.transaction.value, PRODUCT.FTU);
      } else if (result?.purchasable === PRODUCT.NOT_PURCHASABLE) {
        // eslint-disable-next-line max-depth
        try {
          const transactionsEndpoint = '/v1/users/~current/skills/~current/inSkillProductsTransactions';
          const transactions = await _alexaApiCall(handlerInput, transactionsEndpoint);

          const found = transactions.data.results.find((t: { productId: string }) => t.productId === productValue);

          variables.set(permission.transaction.value, found ? found.status : 0);
        } catch (err) {
          variables.set(permission.transaction.value, 0);
        }
      } else {
        variables.set(permission.transaction.value, 0);
      }
    }

    if (!result || !(result.entitled === PRODUCT.ENTITLED || result.entitlementReason === PRODUCT.AUTO_ENTITLED)) {
      return false;
    }
    if (result.type === PRODUCT.CONSUMABLE && permissionVariable) {
      if (result.entitlementReason === PRODUCT.AUTO_ENTITLED) {
        result.activeEntitlementCount = 100;
      }
      variables.set(permissionVariable, result.activeEntitlementCount);
    }
    return true;
  } catch (err) {
    return false;
  }
};

const _accountLinkingPermission = async (accessToken: string, permissionVariable: string | undefined, variables: Store): Promise<boolean> => {
  if (accessToken) {
    if (permissionVariable) variables.set(permissionVariable, accessToken);

    return true;
  }
  return false;
};

const _personIdReadPermission = async (handlerInput: HandlerInput, permissionVariable: string | undefined, variables: Store): Promise<boolean> => {
  try {
    const { personId } = (await handlerInput.requestEnvelope.context.System.person) || {};

    if (permissionVariable) {
      variables.set(permissionVariable, personId ?? 0);
    }

    return true;
  } catch (error) {
    return false;
  }
};

const _profileEmailReadPermission = async (
  handlerInput: HandlerInput,
  permissionVariable: string | undefined,
  variables: Store
): Promise<boolean> => {
  try {
    const email = await handlerInput.serviceClientFactory?.getUpsServiceClient().getProfileEmail();

    if (permissionVariable) {
      variables.set(permissionVariable, email);
    }

    return true;
  } catch (err) {
    return false;
  }
};

const _profileNameReadPermission = async (handlerInput: HandlerInput, permissionVariable: string | undefined, variables: Store): Promise<boolean> => {
  try {
    const name = await handlerInput.serviceClientFactory?.getUpsServiceClient().getProfileName();

    if (permissionVariable) {
      variables.set(permissionVariable, name);
    }

    return true;
  } catch (err) {
    return false;
  }
};

const _profileNumberReadPermission = async (
  handlerInput: HandlerInput,
  permissionVariable: string | undefined,
  variables: Store
): Promise<boolean> => {
  try {
    const number = await handlerInput.serviceClientFactory?.getUpsServiceClient().getProfileMobileNumber();

    if (permissionVariable) {
      variables.set(
        permissionVariable,
        typeof number === 'object' && number?.countryCode && number?.phoneNumber ? `${number.countryCode}${number.phoneNumber}` : number
      );
    }
    return true;
  } catch (err) {
    return false;
  }
};

const _geolocationRead = async (handlerInput: HandlerInput, permissionVariable: string | undefined, variables: Store): Promise<boolean> => {
  const skillPermissionGranted = handlerInput.requestEnvelope.context.System.user.permissions?.scopes?.['alexa::devices:all:geolocation:read'].status;

  if (skillPermissionGranted !== 'GRANTED') {
    return false;
  }

  try {
    const { access, status } = handlerInput.requestEnvelope.context.Geolocation?.locationServices || {};

    if (access === 'ENABLED' && status === 'RUNNING' && permissionVariable) {
      const geoObject = handlerInput.requestEnvelope.context.Geolocation;

      variables.set(permissionVariable, geoObject?.coordinate ? geoObject : undefined);
    }
  } catch (error) {
    if (permissionVariable) {
      variables.set(permissionVariable, undefined);
    }
  }

  return true;
};

const isPermissionGranted = async (permission: Permission, context: Context, variables: Store): Promise<boolean> => {
  const permissionValue = permission?.selected?.value;
  const handlerInput = context.turn.get(T.HANDLER_INPUT);

  if (
    !permissionValue ||
    !handlerInput ||
    ((!Array.isArray(context.storage.get(S.PERMISSIONS)) || !context.storage.get(S.PERMISSIONS).includes(permissionValue)) &&
      !permissionValue.startsWith('UNOFFICIAL') &&
      !permissionValue.startsWith('alexa::person_id'))
  )
    return false;

  const permissionVariable = permission?.map_to?.value;

  if (permissionValue === PERMISSIONS.NOTIFICATIONS_WRITE) {
    return true;
  }

  if (permissionValue === PERMISSIONS.REMINDERS_READ_WRITE) {
    return true;
  }

  if (permissionValue === PERMISSIONS.ISP) {
    return _ispPermission(handlerInput);
  }

  if (permissionValue === PERMISSIONS.PRODUCT && permission?.product?.value) {
    return _productPermission(handlerInput, permission, permissionVariable, context.storage.get(S.LOCALE), variables);
  }

  if (permissionValue === PERMISSIONS.ACCOUNT_LINKING) {
    return _accountLinkingPermission(context.storage.get(S.ACCESS_TOKEN), permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.PERSON_ID_READ) {
    return _personIdReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.PROFILE_EMAIL_READ) {
    return _profileEmailReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.PROFILE_NAME_READ) {
    return _profileNameReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.PROFILE_NUMBER_READ) {
    return _profileNumberReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.GEOLOCATION_READ) {
    return _geolocationRead(handlerInput, permissionVariable, variables);
  }

  return false;
};

export default isPermissionGranted;
