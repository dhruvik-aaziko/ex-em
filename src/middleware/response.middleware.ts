import { NextFunction, Request, Response } from 'express';
import { ERROR_MESSAGES, STATUS_CODE, SUCCESS_MESSAGES } from '../constants';

interface SuccessHttpException {
    status?: number;
    message?: string;
    data: any;
}


export const successMiddleware = (
    success: SuccessHttpException,
    request: Request,
    response: Response,
    next: NextFunction
): boolean => {
    const statusCode = success.status || STATUS_CODE.OK;
    const message = success.message || SUCCESS_MESSAGES.SUCCESSFUL;
    response.status(statusCode).send({
        message,
        status: SUCCESS_MESSAGES.SUCCESS,
        statusCode,
        success: true,
        data: success.data
    });
    return false;
}


interface ErrorHttpException {
    status?: number;
    message?: string;
}

export const errorMiddleware = (
    error: ErrorHttpException,
    request: Request,
    response: Response,
    next: NextFunction
): boolean => {
    const statusCode =
        response.statusCode || error.status || STATUS_CODE.INTERNAL_SERVER_ERROR;
    const message = error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG;
    response.status(statusCode).send({
        message,
        status: ERROR_MESSAGES.ERROR,
        success: false,
        statusCode
    });
    return false;
};