export = Object.freeze({
  ROLES: {
    admin: 'admin',
    superAdmin: 'superAdmin'
   
  },

  AGENT_ROLES_ARRAY: ['admin'],
  USER_GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
  },
  USER_GENDER_ARRAY: ["male", "female", "other"],

  USER_STATUS: {
    ACTIVE: "active",
    BLOCKED: "blocked",
    DISABLED: "disabled",
    INACTIVE: "inactive",
    INVITED: "invited",
    PENDING: "pending"
  },

  USER_STATUS_ARRAY: ["active", "blocked", "disabled", "inactive", "invited", "pending"],

  SIGNIN_WITH: {
    EMAIL: 'email',
    WHATSAPP: 'whatsapp',
    FACEBOOK: 'facebook',
  },

  SIGNIN_WITH_ARRAY: ['email', 'whatsapp', 'facebook'],

  DEFAULT_COINS: 1000,

  DEFAULT_BONUS: 1000,

  DEVICE_TYPE_ARRAY: ['Android', 'Ios'],

  DEFAULT_PUBLISHER_EARNINGS: 1000,

  PREFERENCE_KEY_ARRAY: ['isReceivePromotions', 'isUseCookie'],

  DEFAULT_PLATFORM_FEE: 10,

  PROFILE_IMAGE_EXT_ARRAY: ['.jpeg', '.jpg', '.png'],

  PROFILE_IMAGE_FILE_SIZE: 5, // 5 MB

  VENDOR: 'vendor',
  BUYER: 'buyer',
  ADMIN : 'admin',
  USER_MSG_ARRAY: ['admin', 'buyer']

});
