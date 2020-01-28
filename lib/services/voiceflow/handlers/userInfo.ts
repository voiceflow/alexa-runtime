import { Context, Store } from '@voiceflow/client';
import axios from 'axios';

import { Handler } from '../types';

const REQ_STATUS = {
  BLOCK: 'BLOCK',
  FAIL: 'FAIL',
  SUCCESS: 'SUCCESS',
};

const _getUserInfo = async (permission, context: Context<Record<string, any>>, variables: Store) => {
  const permissionValue = permission?.selected?.value;

  // TODO: set 'permissions' in alexa EventHandler
  if (
    !permissionValue ||
    ((!Array.isArray(context.storage.get('permissions')) || !context.storage.get('permissions').includes(permissionValue)) &&
      !permissionValue.startsWith('UNOFFICIAL') &&
      !permissionValue.startsWith('alexa::person_id'))
  )
    return REQ_STATUS.FAIL;

  const permissionVariable = permission?.map_to?.label?.slice(1, -1); // remove {} from var name

  if (permissionValue === 'alexa::devices:all:notifications:write') {
    return REQ_STATUS.SUCCESS;
  }
  if (permissionValue === 'alexa::alerts:reminders:skill:readwrite') {
    return REQ_STATUS.SUCCESS;
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
      if (status.data === true) return REQ_STATUS.SUCCESS;
      return REQ_STATUS.FAIL;
    } catch (err) {
      return REQ_STATUS.FAIL;
    }
  }
  // TODO: ADD if for 'UNOFFICIAL::product'

  if (permissionValue === 'UNOFFICIAL::account_linking') {
    // TODO: store accessToken in storage. in old code this happens in skill.js/responseRender
    // if (state.accessToken) {
    //   if (permissionVariable) variables.set(permissionVariable, state.accessToken);

    //   return REQ_STATUS.SUCCESS;
    // }
    return REQ_STATUS.FAIL;
  }

  if (permissionValue === 'alexa::person_id:read') {
    try {
      const { personId } = await context.turn.get('handlerInput')?.requestEnvelope.context.System.person;
      if (permissionVariable) variables.set(permissionValue, personId ?? 0);
      return REQ_STATUS.SUCCESS;
    } catch (error) {
      return REQ_STATUS.FAIL;
    }
  }

  if (permissionValue === 'alexa::profile:email:read') {
    try {
      const email = await context.turn
        .get('handlerInput')
        ?.serviceClientFactory.getUpsServiceClient()
        .getProfileEmail();

      if (permissionValue) variables.set(permissionVariable, email);
      return REQ_STATUS.SUCCESS;
    } catch (err) {
      return REQ_STATUS.FAIL;
    }
  }

  if (permissionValue === 'alexa::profile:name:read') {
    try {
      const name = await context.turn
        .get('handlerInput')
        ?.serviceClientFactory.getUpsServiceClient()
        .getProfileName();

      if (permissionVariable) variables.set(permissionVariable, name);
      return REQ_STATUS.SUCCESS;
    } catch (err) {
      if (err.response?.status === 403) return REQ_STATUS.BLOCK;
      return REQ_STATUS.FAIL;
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
      return REQ_STATUS.SUCCESS;
    } catch (err) {
      if (err.response?.status === 403) return REQ_STATUS.BLOCK;
      return REQ_STATUS.FAIL;
    }
  }

  if (permissionValue === 'alexa::devices:all:geolocation:read') {
    const skillPermissionGranted = context.turn.get('handlerInput')?.requestEnvelope.context.System.user.permissions.scopes[
      'alexa::devices:all:geolocation:read'
    ].status;

    if (skillPermissionGranted !== 'GRANTED') return REQ_STATUS.FAIL;

    try {
      const { access, status } = context.turn.get('handlerInput')?.requestEnvelope.context.Geolocation.locationServices;
      if (access === 'ENABLED' && status === 'RUNNING' && permissionVariable) {
        const geoObject = context.turn.get('handlerInput')?.requestEnvelope.context.Geolocation;
        variables.set(permissionVariable, geoObject?.coordinate ? geoObject : undefined);
      }
    } catch (error) {
      if (permissionValue) variables.set(permissionVariable, undefined);
      return REQ_STATUS.SUCCESS;
    }
    return REQ_STATUS.SUCCESS;
  }

  return REQ_STATUS.FAIL;
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
      if (!results.includes(REQ_STATUS.FAIL) && !results.includes(REQ_STATUS.BLOCK)) {
        nextId = block.success_id;
      }
    } else {
      nextId = block.success_id;
    }

    return nextId;
  },
};

export default UserInfoHandler;
