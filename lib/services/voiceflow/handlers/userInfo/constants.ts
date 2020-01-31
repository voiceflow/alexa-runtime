export type Permission = {
  selected?: { value: string };
  map_to?: { value: string };
  product?: { value: string };
  transaction?: { value: string };
} | null;

export enum PERMISSIONS {
  NOTIFICATIONS_WRITE = 'alexa::devices:all:notifications:write',
  REMINDERS_READ_WRITE = 'alexa::alerts:reminders:skill:readwrite',
  ISP = 'UNOFFICIAL::isp',
  PRODUCT = 'UNOFFICIAL::product',
  ACCOUNT_LINKING = 'UNOFFICIAL::account_linking',
  PERSON_ID_READ = 'alexa::person_id:read',
  PROFILE_EMAIL_READ = 'alexa::profile:email:read',
  PROFILE_NAME_READ = 'alexa::profile:name:read',
  PROFILE_NUMBER_READ = 'alexa::profile:mobile_number:read',
  GEOLOCATION_READ = 'alexa::devices:all:geolocation:read',
}

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
