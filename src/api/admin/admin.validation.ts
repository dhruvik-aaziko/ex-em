import { body, param } from 'express-validator';

import { ERROR_MESSAGES, USER_CONSTANT } from '../../constants';
import validate from '../../middleware/validate.middleware';

class AdminValidation {

  createAdminValidation = () =>
    validate([

      body('name')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'name'))
        .isString()
        .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'name')),

      body('lastName')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'lastName'))
        .isString()
        .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'lastName')),

      body('email')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'email'))
        .matches(/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/)
        .withMessage(ERROR_MESSAGES.EMAIL_IS_NOT_PROPER),

      body('password')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'password'))
        .isLength({ min: 8 })
        .withMessage(ERROR_MESSAGES.PASSWORD_MUST_BE_8_CHARACTERS),

      body('role')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'role'))
        .isString()
        .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'role'))
    ]);

  loginAdminValidation = () =>
    validate([
      body('email')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'email'))
        .matches(/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/)
        .withMessage(ERROR_MESSAGES.EMAIL_IS_NOT_PROPER),

      body('password')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'password'))
        .isLength({ min: 8 })
        .withMessage(ERROR_MESSAGES.PASSWORD_MUST_BE_8_CHARACTERS),
    ]);

  updateAdminValidation = () =>
    validate([

      body('name')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'name'))
        .isString()
        .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'name')),

      body('lastName')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'lastName'))
        .isString()
        .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'lastName')),

    ]);

  updateAdminStatusValidation = () =>
    validate([

      body('isActive')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'isActive'))
        .isBoolean()
        .withMessage(ERROR_MESSAGES.COMMON.BOOLEAN.replace(':attribute', 'isActive')),

    ]);

  deleteAdminValidation = () =>
    validate([
      body('adminId')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'adminId'))
        .isMongoId()
        .withMessage(ERROR_MESSAGES.COMMON.INVALID.replace(':attribute', 'adminId')),
    ]);

  forgotPasswordValidation = () =>
    validate([
      body('isEmail')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'isEmail'))
        .isBoolean()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'isEmail')),
      body('email')
        .isEmail()
        .withMessage(ERROR_MESSAGES.EMAIL_IS_NOT_PROPER),
    ]);

  resetPasswordValidation = () =>
    validate([
      body('resetToken')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'resetToken')),
      body('password')
        .notEmpty()
        .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'password'))
        .isLength({ min: 8 })
        .withMessage(ERROR_MESSAGES.PASSWORD_MUST_BE_8_CHARACTERS)
    ]);

  changePasswordValidation = () =>
    validate([
      body('oldPassword')
        .notEmpty()
        .withMessage(
          ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'oldPassword')
        ),
      body('password')
        .notEmpty()
        .withMessage(
          ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'password')
        )
        .isLength({ min: 8 })
        .withMessage(ERROR_MESSAGES.PASSWORD_MUST_BE_8_CHARACTERS)
    ]);

}

export default AdminValidation;
