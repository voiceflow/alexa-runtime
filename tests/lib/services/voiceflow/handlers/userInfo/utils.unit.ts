import { PermissionType } from '@voiceflow/alexa-types';
import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import isPermissionGranted, {
  _accountLinkingPermission,
  _alexaApiCallGenerator,
  _geolocationRead,
  _ispPermissionGenerator,
  _personIdReadPermission,
  _productPermission,
  _productPermissionGenerator,
  _profileEmailReadPermission,
  _profileNameReadPermission,
  _profileNumberReadPermission,
  isPermissionGrantedGenerator,
  PRODUCT,
} from '@/lib/services/runtime/handlers/userInfo/utils';

describe('user info utils unit test', () => {
  describe('isPermissionGranted', () => {
    it('permissionValue is null', async () => {
      const runtime = { turn: { get: sinon.stub().returns(null) }, storage: { get: sinon.stub().returns(null) } };
      expect(await isPermissionGranted(null, runtime as any, null as any)).to.eql(false);
    });

    describe('first if false', () => {
      it('no permission selected', async () => {
        const runtime = { turn: { get: sinon.stub().returns(null) }, storage: { get: sinon.stub().returns(null) } };
        expect(await isPermissionGranted({}, runtime as any, null as any)).to.eql(false);
      });

      it('handlerInput', async () => {
        const runtime = { turn: { get: sinon.stub().returns(null) }, storage: { get: sinon.stub().returns(null) } };
        expect(await isPermissionGranted({ selected: { value: 'random' } }, runtime as any, null as any)).to.eql(false);
      });

      describe('permissions in storage is false', () => {
        it('null', async () => {
          const runtime = { turn: { get: sinon.stub().returns({}) }, storage: { get: sinon.stub().returns(null) } };
          expect(await isPermissionGranted({ selected: { value: 'random' } }, runtime as any, null as any)).to.eql(false);
        });
        it('empty', async () => {
          const runtime = { turn: { get: sinon.stub().returns({}) }, storage: { get: sinon.stub().returns([]) } };
          expect(await isPermissionGranted({ selected: { value: 'random' } }, runtime as any, null as any)).to.eql(false);
        });
      });
    });

    describe('no permissionVariable', () => {
      it('no map_to', async () => {
        const permissionValue = 'p1';
        const runtime = { turn: { get: sinon.stub().returns({}) }, storage: { get: sinon.stub().returns([permissionValue]) } };
        expect(await isPermissionGranted({ selected: { value: permissionValue } }, runtime as any, null as any)).to.eql(false);
      });

      it('no value', async () => {
        const permissionValue = 'p1';
        const runtime = { turn: { get: sinon.stub().returns({}) }, storage: { get: sinon.stub().returns([permissionValue]) } };
        expect(
          await isPermissionGranted({ selected: { value: permissionValue }, map_to: { value: null } } as any, runtime as any, null as any)
        ).to.eql(false);
      });
    });

    it('PERMISSIONS.NOTIFICATIONS_WRITE', async () => {
      const permissionValue = PermissionType.ALEXA_DEVICES_ALL_NOTIFICATIONS_WRITE;
      const runtime = { turn: { get: sinon.stub().returns({}) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue } };
      expect(await isPermissionGranted(permission as any, runtime as any, null as any)).to.eql(true);
    });

    it('PERMISSIONS.REMINDERS_READ_WRITE', async () => {
      const permissionValue = PermissionType.ALEXA_ALERTS_REMINDERS_SKILL_READ_WRITE;
      const handlerInput = 'handler-input';
      const runtime = { turn: { get: sinon.stub().returns(handlerInput) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue } };
      const utils = { _remindersPermissions: sinon.stub().returns(true) };
      expect(await isPermissionGrantedGenerator(utils as any)(permission as any, runtime as any, null as any)).to.eql(true);
      expect(utils._remindersPermissions.args).to.eql([[handlerInput]]);
    });

    it('PERMISSIONS.ALEXA_HOUSEHOLD_LISTS_READ', async () => {
      const permissionValue = PermissionType.ALEXA_HOUSEHOLD_LISTS_READ;
      const runtime = { turn: { get: sinon.stub().returns({}) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue } };
      expect(await isPermissionGranted(permission as any, runtime as any, null as any)).to.eql(true);
    });

    it('PERMISSIONS.ALEXA_HOUSEHOLD_LISTS_WRITE', async () => {
      const permissionValue = PermissionType.ALEXA_HOUSEHOLD_LISTS_WRITE;
      const runtime = { turn: { get: sinon.stub().returns({}) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue } };
      expect(await isPermissionGranted(permission as any, runtime as any, null as any)).to.eql(true);
    });

    it('PERMISSIONS.ISP', async () => {
      const utils = { _ispPermission: sinon.stub().returns(true) };
      const fn = isPermissionGrantedGenerator(utils as any);

      const permissionValue = PermissionType.UNOFFICIAL_ISP;
      const handlerInput = 'handler-input';
      const runtime = { turn: { get: sinon.stub().returns(handlerInput) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue } };
      expect(await fn(permission as any, runtime as any, null as any)).to.eql(true);
      expect(utils._ispPermission.args).to.eql([[handlerInput]]);
    });

    describe('PERMISSIONS.PRODUCT', async () => {
      it('has product value', async () => {
        const utils = { _productPermission: sinon.stub().returns(true) };
        const fn = isPermissionGrantedGenerator(utils as any);

        const permissionValue = PermissionType.UNOFFICIAL_PRODUCT;
        const permissionVariable = 'permission-variable';
        const handlerInput = 'handler-input';
        const variables = 'variables';
        const locale = 'locale';
        const storageGet = sinon
          .stub()
          .withArgs(S.PERMISSIONS)
          .returns([permissionValue])
          .withArgs(S.LOCALE)
          .returns(locale);
        const runtime = { turn: { get: sinon.stub().returns(handlerInput) }, storage: { get: storageGet } };
        const permission = { selected: { value: permissionValue }, map_to: { value: permissionVariable }, product: { value: 'value' } };
        expect(await fn(permission as any, runtime as any, variables as any)).to.eql(true);
        expect(utils._productPermission.args).to.eql([[handlerInput, permission, permissionVariable, runtime.storage.get(S.LOCALE), variables]]);
      });

      it('no product value', async () => {
        const permissionValue = PermissionType.UNOFFICIAL_PRODUCT;
        const runtime = { turn: { get: sinon.stub().returns({}) }, storage: { get: sinon.stub().returns([permissionValue]) } };
        const permission = { selected: { value: permissionValue } };
        expect(await isPermissionGranted(permission as any, runtime as any, null as any)).to.eql(false);
      });
    });

    it('PERMISSIONS.ACCOUNT_LINKING', async () => {
      const utils = { _accountLinkingPermission: sinon.stub().returns(true) };
      const fn = isPermissionGrantedGenerator(utils as any);

      const permissionValue = PermissionType.UNOFFICIAL_ACCOUNT_LINKING;
      const permissionVariable = 'permission-variable';
      const handlerInput = 'handler-input';
      const variables = 'variables';
      const accessToken = 'access-token';
      const storageGet = sinon
        .stub()
        .withArgs(S.PERMISSIONS)
        .returns([permissionValue])
        .withArgs(S.ACCESS_TOKEN)
        .returns(accessToken);
      const runtime = { turn: { get: sinon.stub().returns(handlerInput) }, storage: { get: storageGet } };
      const permission = { selected: { value: permissionValue }, map_to: { value: permissionVariable } };
      expect(await fn(permission as any, runtime as any, variables as any)).to.eql(true);
      expect(utils._accountLinkingPermission.args).to.eql([[accessToken, permissionVariable, variables]]);
    });

    it('PERMISSIONS.PERSON_ID_READ', async () => {
      const utils = { _personIdReadPermission: sinon.stub().returns(true) };
      const fn = isPermissionGrantedGenerator(utils as any);

      const permissionValue = PermissionType.ALEXA_PERSON_ID_READ;
      const permissionVariable = 'permission-variable';
      const handlerInput = 'handler-input';
      const variables = 'variables';
      const runtime = { turn: { get: sinon.stub().returns(handlerInput) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue }, map_to: { value: permissionVariable } };
      expect(await fn(permission as any, runtime as any, variables as any)).to.eql(true);
      expect(utils._personIdReadPermission.args).to.eql([[handlerInput, permissionVariable, variables]]);
    });

    it('PERMISSIONS.PROFILE_EMAIL_READ', async () => {
      const utils = { _profileEmailReadPermission: sinon.stub().returns(true) };
      const fn = isPermissionGrantedGenerator(utils as any);

      const permissionValue = PermissionType.ALEXA_PROFILE_EMAIL_READ;
      const permissionVariable = 'permission-variable';
      const handlerInput = 'handler-input';
      const variables = 'variables';
      const runtime = { turn: { get: sinon.stub().returns(handlerInput) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue }, map_to: { value: permissionVariable } };
      expect(await fn(permission as any, runtime as any, variables as any)).to.eql(true);
      expect(utils._profileEmailReadPermission.args).to.eql([[handlerInput, permissionVariable, variables]]);
    });

    it('PERMISSIONS.PROFILE_NAME_READ', async () => {
      const utils = { _profileNameReadPermission: sinon.stub().returns(true) };
      const fn = isPermissionGrantedGenerator(utils as any);

      const permissionValue = PermissionType.ALEXA_PROFILE_NAME_READ;
      const permissionVariable = 'permission-variable';
      const handlerInput = 'handler-input';
      const variables = 'variables';
      const runtime = { turn: { get: sinon.stub().returns(handlerInput) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue }, map_to: { value: permissionVariable } };
      expect(await fn(permission as any, runtime as any, variables as any)).to.eql(true);
      expect(utils._profileNameReadPermission.args).to.eql([[handlerInput, permissionVariable, variables]]);
    });

    it('PERMISSIONS.PROFILE_NUMBER_READ', async () => {
      const utils = { _profileNumberReadPermission: sinon.stub().returns(true) };
      const fn = isPermissionGrantedGenerator(utils as any);

      const permissionValue = PermissionType.ALEXA_PROFILE_MOBILE_NUMBER_READ;
      const permissionVariable = 'permission-variable';
      const handlerInput = 'handler-input';
      const variables = 'variables';
      const runtime = { turn: { get: sinon.stub().returns(handlerInput) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue }, map_to: { value: permissionVariable } };
      expect(await fn(permission as any, runtime as any, variables as any)).to.eql(true);
      expect(utils._profileNumberReadPermission.args).to.eql([[handlerInput, permissionVariable, variables]]);
    });

    it('PERMISSIONS.GEOLOCATION_READ', async () => {
      const utils = { _geolocationRead: sinon.stub().returns(true) };
      const fn = isPermissionGrantedGenerator(utils as any);

      const permissionValue = PermissionType.ALEXA_DEVICES_ALL_GEOLOCATION_READ;
      const permissionVariable = 'permission-variable';
      const handlerInput = 'handler-input';
      const variables = 'variables';
      const runtime = { turn: { get: sinon.stub().returns(handlerInput) }, storage: { get: sinon.stub().returns([permissionValue]) } };
      const permission = { selected: { value: permissionValue }, map_to: { value: permissionVariable } };
      expect(await fn(permission as any, runtime as any, variables as any)).to.eql(true);
      expect(utils._geolocationRead.args).to.eql([[handlerInput, permissionVariable, variables]]);
    });
  });

  describe('_accountLinkingPermission', () => {
    it('no access token', async () => {
      expect(await _accountLinkingPermission(null as any, null as any, null as any)).to.eql(false);
    });

    it('no permissionValue', async () => {
      expect(await _accountLinkingPermission('access-token', null as any, null as any)).to.eql(true);
    });

    it('with permissionValue', async () => {
      const accessToken = 'access-token';
      const permissionValue = 'permission-value';
      const variables = { set: sinon.stub() };
      expect(await _accountLinkingPermission(accessToken, permissionValue, variables as any)).to.eql(true);
      expect(variables.set.args).to.eql([[permissionValue, accessToken]]);
    });
  });

  describe('_personIdReadPermission', () => {
    it('no handlerInput', () => {
      expect(_personIdReadPermission(null as any, null as any, null as any)).to.eql(false);
    });

    it('no person', () => {
      expect(_personIdReadPermission({ requestEnvelope: { context: { System: {} } } } as any, null as any, null as any)).to.eql(false);
    });

    it('no permissionVariable', () => {
      const handlerInput = { requestEnvelope: { context: { System: { person: { personId: 'person-id' } } } } };
      expect(_personIdReadPermission(handlerInput as any, null as any, null as any)).to.eql(true);
    });

    describe('with permissionVariable', () => {
      it('personId null', () => {
        const personId = null;
        const handlerInput = { requestEnvelope: { context: { System: { person: { personId } } } } };
        const permissionVariable = 'permission-variable';
        const variables = { set: sinon.stub() };
        expect(_personIdReadPermission(handlerInput as any, permissionVariable, variables as any)).to.eql(true);
        expect(variables.set.args).to.eql([[permissionVariable, 0]]);
      });

      it('personId not null', () => {
        const personId = 1;
        const handlerInput = { requestEnvelope: { context: { System: { person: { personId } } } } };
        const permissionVariable = 'permission-variable';
        const variables = { set: sinon.stub() };
        expect(_personIdReadPermission(handlerInput as any, permissionVariable, variables as any)).to.eql(true);
        expect(variables.set.args).to.eql([[permissionVariable, personId]]);
      });
    });
  });

  describe('_profileEmailReadPermission', () => {
    it('no handlerInput', async () => {
      expect(await _profileEmailReadPermission(null as any, null as any, null as any)).to.eql(false);
    });

    it('no serviceClientFactory', async () => {
      expect(await _profileEmailReadPermission({} as any, null as any, null as any)).to.eql(false);
    });

    it('no permissionVariable', async () => {
      const email = 'user@email.com';
      const getProfileEmail = sinon.stub().resolves(email);
      const handlerInput = { serviceClientFactory: { getUpsServiceClient: sinon.stub().returns({ getProfileEmail }) } };
      expect(await _profileEmailReadPermission(handlerInput as any, null as any, null as any)).to.eql(true);
    });

    it('with permissionVariable', async () => {
      const email = 'user@email.com';
      const getProfileEmail = sinon.stub().resolves(email);
      const handlerInput = { serviceClientFactory: { getUpsServiceClient: sinon.stub().returns({ getProfileEmail }) } };
      const permissionVariable = 'permission-variable';
      const variables = { set: sinon.stub() };
      expect(await _profileEmailReadPermission(handlerInput as any, permissionVariable, variables as any)).to.eql(true);
      expect(variables.set.args).to.eql([[permissionVariable, email]]);
    });
  });

  describe('_profileNameReadPermission', () => {
    it('no handlerInput', async () => {
      expect(await _profileNameReadPermission(null as any, null as any, null as any)).to.eql(false);
    });

    it('no serviceClientFactory', async () => {
      expect(await _profileNameReadPermission({} as any, null as any, null as any)).to.eql(false);
    });

    it('no permissionVariable', async () => {
      const name = 'user name';
      const getProfileName = sinon.stub().resolves(name);
      const handlerInput = { serviceClientFactory: { getUpsServiceClient: sinon.stub().returns({ getProfileName }) } };
      expect(await _profileNameReadPermission(handlerInput as any, null as any, null as any)).to.eql(true);
    });

    it('with permissionVariable', async () => {
      const name = 'user name';
      const getProfileName = sinon.stub().resolves(name);
      const handlerInput = { serviceClientFactory: { getUpsServiceClient: sinon.stub().returns({ getProfileName }) } };
      const permissionVariable = 'permission-variable';
      const variables = { set: sinon.stub() };
      expect(await _profileNameReadPermission(handlerInput as any, permissionVariable, variables as any)).to.eql(true);
      expect(variables.set.args).to.eql([[permissionVariable, name]]);
    });
  });

  describe('_profileNumberReadPermission', () => {
    it('no handlerInput', async () => {
      expect(await _profileNumberReadPermission(null as any, null as any, null as any)).to.eql(false);
    });

    it('no serviceClientFactory', async () => {
      expect(await _profileNumberReadPermission({} as any, null as any, null as any)).to.eql(false);
    });

    it('no permissionVariable', async () => {
      const number = 'user number';
      const getProfileMobileNumber = sinon.stub().resolves(number);
      const handlerInput = { serviceClientFactory: { getUpsServiceClient: sinon.stub().returns({ getProfileMobileNumber }) } };
      expect(await _profileNumberReadPermission(handlerInput as any, null as any, null as any)).to.eql(true);
    });

    describe('with permissionVariable', () => {
      it('number is not object', async () => {
        const number = 'user number';
        const getProfileMobileNumber = sinon.stub().resolves(number);
        const handlerInput = { serviceClientFactory: { getUpsServiceClient: sinon.stub().returns({ getProfileMobileNumber }) } };
        const permissionVariable = 'permission-variable';
        const variables = { set: sinon.stub() };
        expect(await _profileNumberReadPermission(handlerInput as any, permissionVariable, variables as any)).to.eql(true);
        expect(variables.set.args).to.eql([[permissionVariable, number]]);
      });

      it('number is null', async () => {
        const number = null;
        const getProfileMobileNumber = sinon.stub().resolves(number);
        const handlerInput = { serviceClientFactory: { getUpsServiceClient: sinon.stub().returns({ getProfileMobileNumber }) } };
        const permissionVariable = 'permission-variable';
        const variables = { set: sinon.stub() };
        expect(await _profileNumberReadPermission(handlerInput as any, permissionVariable, variables as any)).to.eql(true);
        expect(variables.set.args).to.eql([[permissionVariable, number]]);
      });

      it('number is object', async () => {
        const number = { countryCode: '+1', phoneNumber: '123-456-6789' };

        const getProfileMobileNumber = sinon.stub().resolves(number);
        const handlerInput = { serviceClientFactory: { getUpsServiceClient: sinon.stub().returns({ getProfileMobileNumber }) } };
        const permissionVariable = 'permission-variable';
        const variables = { set: sinon.stub() };
        expect(await _profileNumberReadPermission(handlerInput as any, permissionVariable, variables as any)).to.eql(true);
        expect(variables.set.args).to.eql([[permissionVariable, `${number.countryCode}${number.phoneNumber}`]]);
      });
    });
  });

  describe('_geolocationRead', () => {
    it('no permissions', async () => {
      expect(
        await _geolocationRead({ requestEnvelope: { context: { System: { user: { permissions: null } } } } } as any, null as any, null as any)
      ).to.eql(false);
    });

    it('no scopes', async () => {
      expect(
        await _geolocationRead(
          { requestEnvelope: { context: { System: { user: { permissions: { scopes: null } } } } } } as any,
          null as any,
          null as any
        )
      ).to.eql(false);
    });

    it('no Geolocation', async () => {
      const handlerInput = {
        requestEnvelope: {
          context: {
            Geolocation: null,
            System: { user: { permissions: { scopes: { 'alexa::devices:all:geolocation:read': { status: 'GRANTED' } } } } },
          },
        },
      };
      expect(await _geolocationRead(handlerInput as any, null as any, null as any)).to.eql(true);
    });

    it('no locationServices', async () => {
      const permissionVariable = 'permission-variable';
      const variables = { set: sinon.stub() };
      const handlerInput = {
        requestEnvelope: {
          context: {
            Geolocation: { locationServices: null },
            System: { user: { permissions: { scopes: { 'alexa::devices:all:geolocation:read': { status: 'GRANTED' } } } } },
          },
        },
      };
      expect(await _geolocationRead(handlerInput as any, permissionVariable as any, variables as any)).to.eql(true);
      expect(variables.set.args).to.eql([[permissionVariable, undefined]]);
    });

    describe('with locationServices', () => {
      it('access not ENABLED', async () => {
        const permissionVariable = 'permission-variable';
        const handlerInput = {
          requestEnvelope: {
            context: {
              Geolocation: { locationServices: { access: 'random' } },
              System: { user: { permissions: { scopes: { 'alexa::devices:all:geolocation:read': { status: 'GRANTED' } } } } },
            },
          },
        };
        expect(await _geolocationRead(handlerInput as any, permissionVariable as any, null as any)).to.eql(true);
      });

      it('status not RUNNING', async () => {
        const permissionVariable = 'permission-variable';
        const handlerInput = {
          requestEnvelope: {
            context: {
              Geolocation: { locationServices: { access: 'ENABLED', status: 'random' } },
              System: { user: { permissions: { scopes: { 'alexa::devices:all:geolocation:read': { status: 'GRANTED' } } } } },
            },
          },
        };
        expect(await _geolocationRead(handlerInput as any, permissionVariable as any, null as any)).to.eql(true);
      });

      it('no permissionVariable', async () => {
        const handlerInput = {
          requestEnvelope: {
            context: {
              Geolocation: { locationServices: { access: 'ENABLED', status: 'RUNNING' } },
              System: { user: { permissions: { scopes: { 'alexa::devices:all:geolocation:read': { status: 'GRANTED' } } } } },
            },
          },
        };
        expect(await _geolocationRead(handlerInput as any, null as any, null as any)).to.eql(true);
      });

      describe('inside if', () => {
        it('geolocation has coordinate', async () => {
          const permissionVariable = 'permission-variable';
          const variables = { set: sinon.stub() };
          const geoObject = { locationServices: { access: 'ENABLED', status: 'RUNNING' }, coordinate: {} };
          const handlerInput = {
            requestEnvelope: {
              context: {
                Geolocation: geoObject,
                System: { user: { permissions: { scopes: { 'alexa::devices:all:geolocation:read': { status: 'GRANTED' } } } } },
              },
            },
          };
          expect(await _geolocationRead(handlerInput as any, permissionVariable as any, variables as any)).to.eql(true);
          expect(variables.set.args).to.eql([[permissionVariable, geoObject]]);
        });

        it('geolocation does not have coordinate', async () => {
          const permissionVariable = 'permission-variable';
          const variables = { set: sinon.stub() };
          const geoObject = { locationServices: { access: 'ENABLED', status: 'RUNNING' }, coordinate: null };
          const handlerInput = {
            requestEnvelope: {
              context: {
                Geolocation: geoObject,
                System: { user: { permissions: { scopes: { 'alexa::devices:all:geolocation:read': { status: 'GRANTED' } } } } },
              },
            },
          };
          expect(await _geolocationRead(handlerInput as any, permissionVariable as any, variables as any)).to.eql(true);
          expect(variables.set.args).to.eql([[permissionVariable, undefined]]);
        });
      });
    });
  });

  describe('_alexaApiCall', () => {
    it('works correctly', () => {
      const output = 'output';
      const axios = { get: sinon.stub().returns(output) };
      const apiCall = _alexaApiCallGenerator(axios as any);
      const locale = 'locale';
      const host = 'host';
      const apiEndpoint = 'api-endpoint';
      const authorizationValue = 'authorization-value';
      const handlerInput = {
        serviceClientFactory: { apiConfiguration: { apiEndpoint, authorizationValue } },
        requestEnvelope: { request: { locale }, context: { System: { apiEndpoint: `12345678${host}` } } },
      };
      const endpoint = 'endpoint';
      expect(apiCall(handlerInput as any, endpoint)).to.eql(output);
      expect(axios.get.args).to.eql([
        [
          `${apiEndpoint}${endpoint}`,
          {
            headers: {
              Authorization: `Bearer ${authorizationValue}`,
              'Accept-Language': locale,
              Host: host,
            },
          },
        ],
      ]);
    });
  });

  describe('_ispPermission', () => {
    it('true', async () => {
      const apiCall = sinon.stub().resolves({ data: true });
      const _ispPermission = _ispPermissionGenerator(apiCall);
      const handlerInput = 'input';
      expect(await _ispPermission(handlerInput as any)).to.eql(true);
      expect(apiCall.args).to.eql([[handlerInput, '/v1/users/~current/skills/~current/settings/voicePurchasing.enabled']]);
    });

    describe('false', () => {
      it('throws', async () => {
        const apiCall = sinon.stub().throws();
        const _ispPermission = _ispPermissionGenerator(apiCall);
        expect(await _ispPermission(null as any)).to.eql(false);
      });

      it('status data not true', async () => {
        const apiCall = sinon.stub().resolves({ data: false });
        const _ispPermission = _ispPermissionGenerator(apiCall);
        const handlerInput = 'input';
        expect(await _ispPermission(handlerInput as any)).to.eql(false);
      });
    });
  });

  describe('_productPermission', () => {
    it('no permission', async () => {
      expect(await _productPermission(null as any, null as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('no product', async () => {
      expect(await _productPermission(null as any, { product: null } as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('no product value', async () => {
      expect(await _productPermission(null as any, { product: { value: null } } as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('no factory', async () => {
      expect(await _productPermission({} as any, { product: { value: 'value' } } as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('no result', async () => {
      const getInSkillProduct = sinon.stub().resolves(null);
      const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
      const productValue = 'product-value';
      const permission = { product: { value: productValue } };
      const locale = 'locale';
      expect(await _productPermission(handlerInput as any, permission as any, null as any, locale, null as any)).to.eql(false);
      expect(getInSkillProduct.args).to.eql([[locale, productValue]]);
    });

    it('getInSkillProduct throws', async () => {
      const getInSkillProduct = sinon.stub().throws();
      const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
      const productValue = 'product-value';
      const permission = { product: { value: productValue } };
      const locale = 'locale';
      expect(await _productPermission(handlerInput as any, permission as any, null as any, locale, null as any)).to.eql(false);
    });

    it('result entitled and entitlementReason wrong', async () => {
      const getInSkillProduct = sinon.stub().resolves({ entitled: 'random', entitlementReason: 'random' });
      const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
      const productValue = 'product-value';
      const permission = { product: { value: productValue } };
      const locale = 'locale';
      expect(await _productPermission(handlerInput as any, permission as any, null as any, locale, null as any)).to.eql(false);
      expect(getInSkillProduct.args).to.eql([[locale, productValue]]);
    });

    it('result type not CONSUMABLE', async () => {
      const getInSkillProduct = sinon.stub().resolves({ entitled: PRODUCT.ENTITLED, entitlementReason: PRODUCT.AUTO_ENTITLED, type: 'random' });
      const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
      const productValue = 'product-value';
      const permission = { product: { value: productValue } };
      const locale = 'locale';
      expect(await _productPermission(handlerInput as any, permission as any, null as any, locale, null as any)).to.eql(true);
      expect(getInSkillProduct.args).to.eql([[locale, productValue]]);
    });

    describe('result type CONSUMABLE and permissionValue', async () => {
      it('entitlementReason is PRODUCT.AUTO_ENTITLED', async () => {
        const getInSkillProduct = sinon
          .stub()
          .resolves({ entitled: PRODUCT.ENTITLED, entitlementReason: PRODUCT.AUTO_ENTITLED, type: PRODUCT.CONSUMABLE, activeEntitlementCount: 0 });
        const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
        const productValue = 'product-value';
        const permission = { product: { value: productValue } };
        const locale = 'locale';
        const permissionVariable = 'permission-value';
        const variables = { set: sinon.stub() };
        expect(await _productPermission(handlerInput as any, permission as any, permissionVariable as any, locale, variables as any)).to.eql(true);
        expect(variables.set.args).to.eql([[permissionVariable, 100]]);
      });

      it('entitlementReason is not PRODUCT.AUTO_ENTITLED', async () => {
        const count = 5;
        const getInSkillProduct = sinon
          .stub()
          .resolves({ entitled: PRODUCT.ENTITLED, entitlementReason: 'random', type: PRODUCT.CONSUMABLE, activeEntitlementCount: count });
        const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
        const productValue = 'product-value';
        const permission = { product: { value: productValue } };
        const locale = 'locale';
        const permissionVariable = 'permission-value';
        const variables = { set: sinon.stub() };
        expect(await _productPermission(handlerInput as any, permission as any, permissionVariable as any, locale, variables as any)).to.eql(true);
        expect(variables.set.args).to.eql([[permissionVariable, count]]);
      });
    });

    describe('ISP if node', () => {
      it('transaction set to 0', async () => {
        const getInSkillProduct = sinon.stub().resolves(null);
        const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
        const transactionValue = 'transaction-value';
        const permission = { product: { value: 'value' }, transaction: { value: transactionValue } };
        const variables = { set: sinon.stub() };
        expect(await _productPermission(handlerInput as any, permission as any, null as any, null as any, variables as any)).to.eql(false);
        expect(variables.set.args).to.eql([[transactionValue, 0]]);
      });

      it('transaction set to APPROVED_BY_PARENT', async () => {
        const getInSkillProduct = sinon.stub().resolves({ entitlementReason: PRODUCT.PURCHASED, entitled: PRODUCT.ENTITLED });
        const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
        const transactionValue = 'transaction-value';
        const permission = { product: { value: 'value' }, transaction: { value: transactionValue } };
        const variables = { set: sinon.stub() };
        expect(await _productPermission(handlerInput as any, permission as any, null as any, null as any, variables as any)).to.eql(true);
        expect(variables.set.args).to.eql([[transactionValue, 'APPROVED_BY_PARENT']]);
      });

      it('transaction set to FTU', async () => {
        const getInSkillProduct = sinon.stub().resolves({ entitlementReason: PRODUCT.AUTO_ENTITLED });
        const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
        const transactionValue = 'transaction-value';
        const permission = { product: { value: 'value' }, transaction: { value: transactionValue } };
        const variables = { set: sinon.stub() };
        expect(await _productPermission(handlerInput as any, permission as any, null as any, null as any, variables as any)).to.eql(true);
        expect(variables.set.args).to.eql([[transactionValue, 'FTU']]);
      });

      describe('product NOT_PURCHASABLE', () => {
        it('apiCall throws', async () => {
          const apiCall = sinon.stub().throws();
          const fn = _productPermissionGenerator(apiCall);

          const getInSkillProduct = sinon.stub().resolves({ purchasable: PRODUCT.NOT_PURCHASABLE });
          const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
          const transactionValue = 'transaction-value';
          const permission = { product: { value: 'value' }, transaction: { value: transactionValue } };
          const variables = { set: sinon.stub() };
          expect(await fn(handlerInput as any, permission as any, null as any, null as any, variables as any)).to.eql(false);
          expect(variables.set.args).to.eql([[transactionValue, 0]]);
        });

        it('finds transaction', async () => {
          const productValue = 'product-value';
          const status = 2;
          const transactions = {
            data: {
              results: [
                { productId: 'random', status: 1 },
                { productId: productValue, status },
              ],
            },
          };
          const apiCall = sinon.stub().returns(transactions);
          const fn = _productPermissionGenerator(apiCall);

          const getInSkillProduct = sinon.stub().resolves({ purchasable: PRODUCT.NOT_PURCHASABLE });
          const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
          const transactionValue = 'transaction-value';
          const permission = { product: { value: productValue }, transaction: { value: transactionValue } };
          const variables = { set: sinon.stub() };
          expect(await fn(handlerInput as any, permission as any, null as any, null as any, variables as any)).to.eql(false);
          expect(variables.set.args).to.eql([[transactionValue, status]]);
        });

        it('does not transaction', async () => {
          const transactions = {
            data: {
              results: [
                { productId: 'random', status: 1 },
                { productId: 'random2', status: 2 },
              ],
            },
          };
          const apiCall = sinon.stub().returns(transactions);
          const fn = _productPermissionGenerator(apiCall);

          const getInSkillProduct = sinon.stub().resolves({ purchasable: PRODUCT.NOT_PURCHASABLE });
          const handlerInput = { serviceClientFactory: { getMonetizationServiceClient: sinon.stub().returns({ getInSkillProduct }) } };
          const transactionValue = 'transaction-value';
          const permission = { product: { value: 'value' }, transaction: { value: transactionValue } };
          const variables = { set: sinon.stub() };
          expect(await fn(handlerInput as any, permission as any, null as any, null as any, variables as any)).to.eql(false);
          expect(variables.set.args).to.eql([[transactionValue, 0]]);
        });
      });
    });
  });
});
