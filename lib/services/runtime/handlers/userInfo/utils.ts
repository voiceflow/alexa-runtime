import { PermissionType } from '@voiceflow/alexa-types';
import { Permission } from '@voiceflow/alexa-types/build/nodes/userInfo';
import { Runtime, Store } from '@voiceflow/runtime';
import { services } from 'ask-sdk-model';
import axios, { AxiosStatic } from 'axios';

import { Storage as S, Turn as T } from '@/lib/constants/flags';
import { AlexaHandlerInput } from '@/lib/services/alexa/types';

export enum PRODUCT {
  ENTITLED = 'ENTITLED',
  // entitlement reason
  PURCHASED = 'PURCHASED',
  AUTO_ENTITLED = 'AUTO_ENTITLED',
  // type
  CONSUMABLE = 'CONSUMABLE',
  // var value
  APPROVED_BY_PARENT = 'APPROVED_BY_PARENT',
  FTU = 'FTU',
  NOT_PURCHASABLE = 'NOT_PURCHASABLE',
}

export const _alexaApiCallGenerator = (http: AxiosStatic) => (handlerInput: AlexaHandlerInput, endpoint: string) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const { apiConfiguration } = handlerInput.serviceClientFactory;

  const { apiEndpoint, authorizationValue } = apiConfiguration;

  return http.get(`${apiEndpoint}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${authorizationValue}`,
      'Accept-Language': handlerInput.requestEnvelope.request.locale,
      Host: handlerInput.requestEnvelope.context.System.apiEndpoint.substring(8),
    },
  });
};

const _alexaApiCall = _alexaApiCallGenerator(axios);

export const _ispPermissionGenerator = (apiCall: typeof _alexaApiCall) => async (handlerInput: AlexaHandlerInput): Promise<boolean> => {
  try {
    const voicePurchasingEndpoint = '/v1/users/~current/skills/~current/settings/voicePurchasing.enabled';
    const status = await apiCall(handlerInput, voicePurchasingEndpoint);
    return status.data === true;
  } catch (err) {
    return false;
  }
};

export const _remindersPermissions = async (handlerInput?: AlexaHandlerInput): Promise<boolean> =>
  !!(await handlerInput?.serviceClientFactory
    ?.getReminderManagementServiceClient()
    .getReminders()
    .then(() => true)
    .catch(() => false));

const _transactionPermissionGenerator = async ({
  result,
  apiCall,
  variables,
  transaction,
  handlerInput,
  productValue,
}: {
  result: services.monetization.InSkillProduct;
  apiCall: typeof _alexaApiCall;
  variables: Store;
  transaction?: { value: string };
  handlerInput: AlexaHandlerInput;
  productValue: string;
}) => {
  if (!transaction?.value) {
    return;
  }

  if (result?.entitlementReason === PRODUCT.PURCHASED && result.entitled === PRODUCT.ENTITLED) {
    variables.set(transaction.value, PRODUCT.APPROVED_BY_PARENT);
  } else if (result?.entitlementReason === PRODUCT.AUTO_ENTITLED) {
    variables.set(transaction.value, PRODUCT.FTU);
  } else if (result?.purchasable === PRODUCT.NOT_PURCHASABLE) {
    // eslint-disable-next-line max-depth
    try {
      const transactionsEndpoint = '/v1/users/~current/skills/~current/inSkillProductsTransactions';
      const transactions = await apiCall(handlerInput, transactionsEndpoint);

      const found = transactions.data.results.find((t: { productId: string }) => t.productId === productValue);

      variables.set(transaction.value, found ? found.status : 0);
    } catch (err) {
      variables.set(transaction.value, 0);
    }
  } else {
    variables.set(transaction.value, 0);
  }
};

export const _productPermissionGenerator = (apiCall: typeof _alexaApiCall) => async (
  handlerInput: AlexaHandlerInput,
  permission: Partial<Permission>,
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
    _transactionPermissionGenerator({
      result,
      apiCall,
      variables,
      // FIXME: add transaction type or remove it since never used on the FE
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      transaction: permission.transaction,
      handlerInput,
      productValue,
    });

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

export const _personIdReadPermission = (handlerInput: AlexaHandlerInput, permissionVariable: string | undefined, variables: Store): boolean => {
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
  handlerInput: AlexaHandlerInput,
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
  handlerInput: AlexaHandlerInput,
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
  handlerInput: AlexaHandlerInput,
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

export const _geolocationRead = async (
  handlerInput: AlexaHandlerInput,
  permissionVariable: string | undefined,
  variables: Store
): Promise<boolean> => {
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
  _remindersPermissions,
};

export const isPermissionGrantedGenerator = (utils: typeof utilsObj) => async (
  permission: Partial<Permission> | null,
  runtime: Runtime,
  variables: Store
): Promise<boolean> => {
  if (!permission) return false;

  const permissionValue = permission.selected?.value;
  const handlerInput = runtime.turn.get<AlexaHandlerInput>(T.HANDLER_INPUT);

  if (permissionValue === PermissionType.ALEXA_ALERTS_REMINDERS_SKILL_READ_WRITE) {
    return utils._remindersPermissions(handlerInput);
  }

  if (
    !permissionValue ||
    !handlerInput ||
    ((!Array.isArray(runtime.storage.get<string[]>(S.PERMISSIONS)) || !runtime.storage.get<string[]>(S.PERMISSIONS)!.includes(permissionValue)) &&
      !permissionValue.startsWith('UNOFFICIAL') &&
      !permissionValue.startsWith('alexa::person_id'))
  )
    return false;

  const permissionVariable = permission.map_to?.value;

  if (permissionValue === PermissionType.ALEXA_DEVICES_ALL_NOTIFICATIONS_WRITE) {
    return true;
  }

  if (permissionValue === PermissionType.ALEXA_HOUSEHOLD_LISTS_READ) {
    return true;
  }

  if (permissionValue === PermissionType.ALEXA_HOUSEHOLD_LISTS_WRITE) {
    return true;
  }

  if (permissionValue === PermissionType.UNOFFICIAL_ISP) {
    return utils._ispPermission(handlerInput);
  }

  if (permissionValue === PermissionType.UNOFFICIAL_PRODUCT && permission.product?.value) {
    return utils._productPermission(handlerInput, permission, permissionVariable, runtime.storage.get<string>(S.LOCALE)!, variables);
  }

  if (permissionValue === PermissionType.UNOFFICIAL_ACCOUNT_LINKING) {
    return utils._accountLinkingPermission(runtime.storage.get<string>(S.ACCESS_TOKEN)!, permissionVariable, variables);
  }

  if (permissionValue === PermissionType.ALEXA_PERSON_ID_READ) {
    return utils._personIdReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PermissionType.ALEXA_PROFILE_EMAIL_READ) {
    return utils._profileEmailReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PermissionType.ALEXA_PROFILE_NAME_READ) {
    return utils._profileNameReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PermissionType.ALEXA_PROFILE_MOBILE_NUMBER_READ) {
    return utils._profileNumberReadPermission(handlerInput, permissionVariable, variables);
  }

  if (permissionValue === PermissionType.ALEXA_DEVICES_ALL_GEOLOCATION_READ) {
    return utils._geolocationRead(handlerInput, permissionVariable, variables);
  }

  return false;
};

export default isPermissionGrantedGenerator(utilsObj);
