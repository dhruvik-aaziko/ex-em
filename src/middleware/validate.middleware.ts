import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { STATUS_CODE, ERROR_MESSAGES } from '../constants';
import Logger from '../logger';

const validate = (validations: ValidationChain[]) => {
  return async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    await Promise.all(validations.map((validation) => validation.run(request)));

    const errors = validationResult(request);
    if (errors.isEmpty()) {
      return next();
    }
    Logger.error(`Error in validation: ${errors.array()[0].msg}`);

    response.status(STATUS_CODE.BAD_REQUEST).json({
      ...errors.array()[0],
      status: ERROR_MESSAGES.ERROR,
      statusCode: STATUS_CODE.BAD_REQUEST,
      success: false
    });
  };
};

export default validate;
