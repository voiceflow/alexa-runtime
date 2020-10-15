import { Context, Store } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import axios, { AxiosStatic } from 'axios';

import { Storage as S, Turn as T } from '@/lib/constants/flags';

import { Permission, PERMISSIONS, PRODUCT } from './constants';

export const _alexaApiCallGenerator = (http: AxiosStatic) => (handlerInput: any, endpoint: string) => {
  const { apiEndpoint, authorizationValue } = handlerInput.serviceClientFactory.apiConfiguration;
  return http.get(`${apiEndpoint}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${authorizationValue}`,
      'Accept-Language': handlerInput.requestEnvelope.request.locale,
      Host: handlerInput.requestEnvelope.context.System.apiEndpoint.substring(8),
    },
  });
};

const _alexaApiCall = _alexaApiCallGenerator(axios);

export const _ispPermissionGenerator = (apiCall: typeof _alexaApiCall) => async (handlerInput: HandlerInput): Promise<boolean> => {
  try {
    const voicePurchasingEndpoint = '/v1/users/~current/skills/~current/settings/voicePurchasing.enabled';
    const status = await apiCall(handlerInput, voicePurchasingEndpoint);
    return status.data === true;
  } catch (err) {
    return false;
  }
};

export const _productPermissionGenerator = (apiCall: typeof _alexaApiCall) => async (
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

    const factory = handlerInput.serviceClientFactory;
    if (!factory) return false;

    const result = await factory.getMonetizationServiceClient().getInSkillProduct(locale, productValue);

    // Kids ISP testing
    if (permission.transaction && permission.transaction.value) {
      if (result?.entitlementReason === PRODUCT.PURCHASED && result.entitled === PRODUCT.ENTITLED) {
        variables.set(permission.transaction.value, PRODUCT.APPROVED_BY_PARENT);
      } else if (result?.entitlementReason === PRODUCT.AUTO_ENTITLED) {
        variables.set(permission.transaction.value, PRODUCT.FTU);
      } else if (result?.purchasable === PRODUCT.NOT_PURCHASABLE) {
        // eslint-disable-next-line max-depth
        try {
          const transactionsEndpoint = '/v1/users/~current/skills/~current/inSkillProductsTransactions';
          const transactions = await apiCall(handlerInput, transactionsEndpoint);

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

export const _productPermission = _productPermissionGenerator(_alexaApiCall);

export const _accountLinkingPermission = async (accessToken: string, permissionVariable: string | undefined, variables: Store): Promise<boolean> => {
  if (accessToken) {
    if (permissionVariable) variables.set(permissionVariable, accessToken);

    return true;
  }
  return false;
};

export const _personIdReadPermission = (handlerInput: HandlerInput, permissionVariable: string | undefined, variables: Store): boolean => {
  try {
    const { person } = handlerInput.requestEnvelope.context.System;
    if (!person) return false;

    const { personId } = person;

    if (permissionVariable) {
      variables.set(permissionVariable, personId ?? 0);
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const _profileEmailReadPermission = async (
  handlerInput: HandlerInput,
  permissionVariable: string | undefined,
  variables: Store
): Promise<boolean> => {
  try {
    const factory = handlerInput.serviceClientFactory;
    if (!factory) return false;

    const email = await factory.getUpsServiceClient().getProfileEmail();

    if (permissionVariable) {
      variables.set(permissionVariable, email);
    }

    return true;
  } catch (err) {
    return false;
  }
};

export const _profileNameReadPermission = async (
  handlerInput: HandlerInput,
  permissionVariable: string | undefined,
  variables: Store
): Promise<boolean> => {
  try {
    const factory = handlerInput.serviceClientFactory;
    if (!factory) return false;

    const name = await factory.getUpsServiceClient().getProfileName();

    if (permissionVariable) {
      variables.set(permissionVariable, name);
    }

    return true;
  } catch (err) {
    return false;
  }
};

export const _profileNumberReadPermission = async (
  handlerInput: HandlerInput,
  permissionVariable: string | undefined,
  variables: Store
): Promise<boolean> => {
  try {
    const factory = handlerInput.serviceClientFactory;
    if (!factory) return false;

    const number = await factory.getUpsServiceClient().getProfileMobileNumber();

    if (permissionVariable) {
      variables.set(
        permissionVariable,
        typeof number === 'object' && number?.countryCode && number.phoneNumber ? `${number.countryCode}${number.phoneNumber}` : number
      );
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const _geolocationRead = async (handlerInput: HandlerInput, permissionVariable: string | undefined, variables: Store): Promise<boolean> => {
  const skillPermissionGranted = handlerInput.requestEnvelope.context.System.user.permissions?.scopes?.['alexa::devices:all:geolocation:read'].status;

  if (skillPermissionGranted !== 'GRANTED') {
    return false;
  }

  try {
    const geoObject = handlerInput.requestEnvelope.context.Geolocation;
    if (!geoObject) throw new Error('no Geolocation');
    const { locationServices } = geoObject;
    if (!locationServices) throw new Error('no locationServices');

    const { access, status } = locationServices;

    if (access === 'ENABLED' && status === 'RUNNING' && permissionVariable) {
      variables.set(permissionVariable, geoObject.coordinate ? geoObject : undefined);
    }
  } catch (error) {
    if (permissionVariable) {
      variables.set(permissionVariable, undefined);
    }
  }

  return true;
};

const utilsObj = {
  _ispPermission: _ispPermissionGenerator(_alexaApiCall),
  _productPermission,
  _accountLinkingPermission,
  _personIdReadPermission,
  _profileEmailReadPermission,
  _profileNameReadPermission,
  _profileNumberReadPermission,
  _geolocationRead,
};

export const isPermissionGrantedGenerator = (utils: typeof utilsObj) => async (
  permission: Permission,
  context: Context,
  variables: Store
): Promise<boolean> => {
  if (!permission) return false;

  const permissionValue = permission.selected?.value;
  const handlerInput = context.turn.get(T.HANDLER_INPUT);

  if (
    !permissionValue ||
    !handlerInput ||
    ((!Array.isArray(context.storage.get(S.PERMISSIONS)) || !context.storage.get(S.PERMISSIONS).includes(permissionValue)) &&
      !permissionValue.startsWith('UNOFFICIAL') &&
      !permissionValue.startsWith('alexa::person_id'))
  )
    return false;

  const permissionVariable = permission.map_to?.value;

  if (permissionValue === PERMISSIONS.NOTIFICATIONS_WRITE) {
    return true;
  }

  if (permissionValue === PERMISSIONS.REMINDERS_READ_WRITE) {
    return true;
  }

  if (permissionValue === PERMISSIONS.ALEXA_HOUSEHOLD_LISTS_READ) {
    return true;
  }

  if (permissionValue === PERMISSIONS.ALEXA_HOUSEHOLD_LISTS_WRITE) {
    return true;
  }

  if (permissionValue === PERMISSIONS.ISP) {
    return utils._ispPermission(handlerInput);
  }

  if (permissionValue === PERMISSIONS.PRODUCT && permission.product?.value) {
    return utils._productPermission(handlerInput, permission, permissionVariable, context.storage.get(S.LOCALE), variables);
  }

  if (permissionValue === PERMISSIONS.ACCOUNT_LINKING) {
    return utils._accountLinkingPermission(context.storage.get(S.ACCESS_TOKEN), permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.PERSON_ID_READ) {
    return utils._personIdReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.PROFILE_EMAIL_READ) {
    return utils._profileEmailReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.PROFILE_NAME_READ) {
    return utils._profileNameReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.PROFILE_NUMBER_READ) {
    return utils._profileNumberReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PERMISSIONS.GEOLOCATION_READ) {
    return utils._geolocationRead(handlerInput, permissionVariable, variables);
  }

  return false;
};

export default isPermissionGrantedGenerator(utilsObj);
