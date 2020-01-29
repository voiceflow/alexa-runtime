/* eslint-disable max-depth */
import { Context, Store } from '@voiceflow/client';
import axios from 'axios';

import { Storage as S } from '@/lib/constants/flags';

import { Handler } from '../types';

const _getUserInfo = async (permission, context: Context<Record<string, any>>, variables: Store): Promise<boolean> => {
  const permissionValue = permission?.selected?.value;

  if (
    !permissionValue ||
    ((!Array.isArray(context.storage.get(S.PERMISSIONS)) || !context.storage.get(S.PERMISSIONS).includes(permissionValue)) &&
      !permissionValue.startsWith('UNOFFICIAL') &&
      !permissionValue.startsWith('alexa::person_id'))
  )
    return false;

  const permissionVariable = permission?.map_to?.label?.slice(1, -1); // remove {} from var name

  if (permissionValue === 'alexa::devices:all:notifications:write') {
    return true;
  }

  if (permissionValue === 'alexa::alerts:reminders:skill:readwrite') {
    return true;
  }

  if (permissionValue === 'UNOFFICIAL::isp') {
    try {
      const { apiEndpoint, authorizationValue } = context.turn.get('handlerInput')?.serviceClientFactory.apiConfiguration;
      const status = await axios.get(`${apiEndpoint}/v1/users/~current/skills/~current/settings/voicePurchasing.enabled`, {
        headers: {
          Authorization: `Bearer ${authorizationValue}`,
          'Accept-Language': context.turn.get('handlerInput')?.requestEnvelope.request.locale,
          Host: context.turn.get('handlerInput')?.requestEnvelope.context.System.apiEndpoint.substring(8),
        },
      });
      if (status.data === true) return true;
      return false;
    } catch (err) {
      return false;
    }
  }

  if (permissionValue === 'UNOFFICIAL::product' && permission.product && permission.product.value) {
    try {
      const result = await context.turn
        .get('handlerInput')
        ?.serviceClientFactory.getMonetizationServiceClient()
        .getInSkillProduct(context.storage.get(S.LOCALE), permission.product.value);

      // Kids ISP testing
      if (permission.transaction && permission.transaction.value) {
        if (result.entitlementReason === 'PURCHASED' && result.entitled === 'ENTITLED') {
          variables.set(permission.transaction.value, 'APPROVED_BY_PARENT');
        } else if (result.entitlementReason === 'AUTO_ENTITLED') {
          variables.set(permission.transaction.value, 'FTU');
        } else if (result.purchasable === 'NOT_PURCHASABLE') {
          try {
            const { apiEndpoint, authorizationValue } = context.turn.get('handlerInput')?.serviceClientFactory.apiConfiguration;
            const transactions = await axios.get(`${apiEndpoint}/v1/users/~current/skills/~current/inSkillProductsTransactions`, {
              headers: {
                Authorization: `Bearer ${authorizationValue}`,
                'Accept-Language': context.turn.get('handlerInput')?.requestEnvelope.request.locale,
                Host: context.turn.get('handlerInput')?.requestEnvelope.context.System.apiEndpoint.substring(8),
              },
            });

            const found = transactions.data.results.find((t) => t.productId === permission.product.value);
            variables.set(permission.transaction.value, found ? found.status : 0);
          } catch (err) {
            variables.set(permission.transaction.value, 0);
          }
        } else {
          variables.set(permission.transaction.value, 0);
        }
      }

      if (!result || !(result.entitled === 'ENTITLED' || result.entitlementReason === 'AUTO_ENTITLED')) {
        return false;
      }
      if (result.type === 'CONSUMABLE' && permissionVariable) {
        if (result.entitlementReason === 'AUTO_ENTITLED') {
          result.activeEntitlementCount = 100;
        }
        variables.set(permissionVariable, result.activeEntitlementCount);
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  if (permissionValue === 'UNOFFICIAL::account_linking') {
    if (context.storage.get(S.ACCESS_TOKEN)) {
      if (permissionVariable) variables.set(permissionVariable, context.storage.get(S.ACCESS_TOKEN));

      return true;
    }
    return false;
  }

  if (permissionValue === 'alexa::person_id:read') {
    try {
      const { personId } = await context.turn.get('handlerInput')?.requestEnvelope.context.System.person;
      if (permissionVariable) variables.set(permissionValue, personId ?? 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  if (permissionValue === 'alexa::profile:email:read') {
    try {
      const email = await context.turn
        .get('handlerInput')
        ?.serviceClientFactory.getUpsServiceClient()
        .getProfileEmail();

      if (permissionValue) variables.set(permissionVariable, email);
      return true;
    } catch (err) {
      return false;
    }
  }

  if (permissionValue === 'alexa::profile:name:read') {
    try {
      const name = await context.turn
        .get('handlerInput')
        ?.serviceClientFactory.getUpsServiceClient()
        .getProfileName();

      if (permissionVariable) variables.set(permissionVariable, name);
      return true;
    } catch (err) {
      return false;
    }
  }

  if (permissionValue === 'alexa::profile:mobile_number:read') {
    try {
      const number = await context.turn
        .get('handlerInput')
        ?.serviceClientFactory.getUpsServiceClient()
        .getProfileMobileNumber();

      if (permissionVariable)
        variables.set(
          permissionVariable,
          typeof number === 'object' && number.countryCode && number.phoneNumber ? number.countryCode + number.phoneNumber : number
        );
      return true;
    } catch (err) {
      return false;
    }
  }

  if (permissionValue === 'alexa::devices:all:geolocation:read') {
    const skillPermissionGranted = context.turn.get('handlerInput')?.requestEnvelope.context.System.user.permissions.scopes[
      'alexa::devices:all:geolocation:read'
    ].status;

    if (skillPermissionGranted !== 'GRANTED') return false;

    try {
      const { access, status } = context.turn.get('handlerInput')?.requestEnvelope.context.Geolocation.locationServices;
      if (access === 'ENABLED' && status === 'RUNNING' && permissionVariable) {
        const geoObject = context.turn.get('handlerInput')?.requestEnvelope.context.Geolocation;
        variables.set(permissionVariable, geoObject?.coordinate ? geoObject : undefined);
      }
    } catch (error) {
      if (permissionValue) variables.set(permissionVariable, undefined);
      return true;
    }
    return true;
  }

  return false;
};

const UserInfoHandler: Handler = {
  canHandle: (block) => {
    return block.permissions;
  },
  handle: async (block, context, variables) => {
    let nextId = block.fail_id;

    const requests = [];
    if (Array.isArray(block.permissions) && block.permissions.length) {
      block.permissions.forEach((p) => requests.push(_getUserInfo(p, context, variables)));
      const results = await Promise.all(requests);
      if (!results.includes(false)) {
        nextId = block.success_id;
      }
    } else {
      nextId = block.success_id;
    }

    return nextId;
  },
};

export default UserInfoHandler;
