export = Object.freeze({
  ERROR: 'error',
  NOT_FOUND: 'Not found',
  EMAIL_NOT_FOUND: 'Enter Valid Email',
  EMAIL_IS_NOT_PROPER: 'Email is not proper',
  EMAIL_ALREADY_TAKEN: 'Email already taken',
  NOT_VALID_OTP: 'Provied OTP is not valid or expired',
  EMAIL_NOT_VERIFIED: "Please verify your account first with otp sent to your email or phone",
  DEACTIVE_USER: "Your activeStatus is deActive Please contact your administrator",

  CURRENT_PASSWORD_NOT_MATCH : 'Current Password does not match',
  PASSWORD_NOT_MATCH: 'Enter Valid Password',
  PASSWORD_MUST_BE_8_CHARACTERS: 'password must be 8 characters',

  TOKEN_EXPIRED: 'Token Expired',
  INVALID_TOKEN: 'Invalid Token',
  ENTER_VALID : 'Enter Valid phone number',

  TOKEN_LINK_EXPIRED: 'Your link has been expired. Please Generate New Link',

  SOMETHING_WENT_WRONG: 'Something went wrong',
  NOT_ACCESS: 'You have not right to perform this action.',
  YO_CANT_QUOTE : 'You can not Quote this LSQ. because Quote limit over.',

  COMMON: {
    STRING: 'The :attribute must be a string.',
    ALREADY_CREATED: ':attribute already Created',
    NOT_FOUND: ':attribute is Not found',
    NOT_VALID: ':attribute is Not Valid',
    REQUIRED: 'The :attribute field is required.',
    INVALID: 'The selected :attribute is invalid.',
    NUMERIC: 'The :attribute must be a number.',
    DATE: 'The :attribute must be a date.',
    BETWEEN: 'The :attribute must be between :min to :max.',
    NOT_EXISTS: 'The selected :attribute does not exist.',
    NOT_ACTIVE: 'The selected :attribute does not active.',
    VALIDATED: ':attribute validate successfully',
    ENTER_VALID : 'Enter Valid :attribute',
    ALPHA_NUMERIC:
      'The :attribute field must be contains only alpha numeric value.',
    MIN: 'The :attribute must be at least :min characters.',
    BOOLEAN: 'The :attribute must be a true or false.',
    IN: 'The :attribute must be one of :values.',
    INVALID_FORMAT: 'The :attribute must be in :format format.',
    GRATER: 'The :attribute must be greater than :another.',
    ALREADY_EXISTS: 'This :attribute is already exists.',
    ARRAY: 'The :attribute must be an array.',
    OBJECT: 'The :attribute must be an object.',
    EXACT: `The length of :attribute must be :value.`,
    GRATER_OR_EQUAL: 'The :attribute must be :another or greater.',
    FILE_TYPE: 'The type of :attribute must be :values.',
    MAX_FILE_SIZE: 'The :attribute may not be greater than :value.',
    MAX: 'The length :attribute may not be greater than :value.',
    IMAGE_DIMENSTIONS: 'The dimenstions of :attribute must be :format.',
    MAX_UPLOAD_FILE: 'The maximum :attribute may not be greater than :value.',
    PLEASE_VALID: 'Please enter valid :attribute.',
    INSUFFICIENT_BALANCE: ':attribute not enough balance.',
    MAXIMUM: 'The :attribute may not be greater than :value.',
    NOT_SAME: 'The :attribute must be different.',
    NOT_SAME_VALUE: 'The :attribute1 and :attribute2 must be different.',
    MINIMUM: 'The :attribute may not be smaller than :value.',
    ALREADY: 'This :attribute is already :value.',
    MIN_AMOUNT: 'Please add minimum :min amount to apply this :value.',
    INVALID_OR_EXPIRE: 'The selected :attribute is invalid or expired.',
    IS_NOT_SAME: 'The :attribute is not :value.',
    MAX_STRING: 'The :attribute may not be greater than :max characters.',
    LIMIT_EXCEED: 'You have reached your maximum limit of :value.',
    PLEASE_ADD_BEFORE: 'Please add :attribute before :action :value.',
    ARRAY_WITH_MIN:
      'The :attribute must be an array and contains atleast :min elements.',
    ARRAY_WITH_MAX:
      'The :attribute must be an array and contains maximum :max elements.',
    FLAG_OFF: 'The :attribute feature is disable.',
    ALREADY_IN_USE: 'This :attribute already in used.',
    MINIMUM_AMOUNT: 'Please add minimum :min amount.',
    SOMETHING_WENT_WRONG: 'Something went wrong in :attribute.',
    CANCEL_DELETE_ACCOUNT:
      'The :attribute cancel account deletion time period is expired.',
    PENDING: 'You can not :action this :attribute because some pending :value.',
    PLEASE_DO_BEFORE: 'Please :action :attribute before :action2 :value.'
  },

  KYC_ALREADY_APPROVED: 'Your KYC request already approved.',

  INSUFFICIENT_BALANCE: 'You have not enough balance.',

  FUND_ACCOUNT_NOT_EXISTS: 'Your fund account not created yet.',

  BLOCKED_USER:
    'Your account has been deactivated. Please contact the administrator to reactivate it.',

  USER_ACC_DELETED: 'Your account has been deleted.',

  ALREADY_LOGIN: 'Login into another device.',

  GAME_INFO_INCOMPLETE:
    'Please complete game Info before uploading game build.',

  GAME_MODE_NOT_ON: 'Please turn on game mode.',

  GAME_MODE_IN_USE: 'There are some tournament running on this game mode.',

  MIN_GAME_MODES: 'Please maintain atleast 2 game modes.',

  ONE_OFFER: 'Sorry, More than one offer not allowed.',

  THERE_WAS_ISSUE: 'There was an issue into :value.',

  MGP_RELEASE_ON_HALT: 'This mgp version on halt.',

  PENDING_WITHDRAWAL_EXISTS:
    'You can not unlink this bank account because some pending withdrawals exists on this bank account.',

  KEY_SUM_EXACT: 'The total of :attribute must be 100%.',

  ALREADY_USED_ACCOUNT:
    'You can not delete this :attribute because this is used somewhere.',

  MUST_VERIFY_KYC: 'You must have to verify your aadhar card and pan card.',

  MUST_VERIFY_PANCARD: 'You must have to verify your pan card.',

  TEMPORARILY_UNAVAILABLE:
    ':attribute feature is temporarily unavailable. Try again later.',

  MAINTENANCE_REQUIRED:
    'Please Put Game in Maintenance then after you can update :attribute.'
});
