// import { NextFunction, Response, Request } from 'express';
// import * as jwt from 'jsonwebtoken';
// import { ERROR_MESSAGES, STATUS_CODE } from '../constants';
// import getconfig from '../config';
// import Logger from '../logger';
// import RequestWithOtpData from '../interfaces/requestWithOtpData.interface';
// const { JWT_SECRET } = getconfig();

// async function otpAuthMiddleware(
//   request: Request,
//   response: Response,
//   next: NextFunction
// ): Promise<boolean> {
//   try {

//     const req = request as RequestWithOtpData;
//     const secret = JWT_SECRET;
//     const authHeader = req.headers.authorization as string;
//     console.log('authHeader --->> ', authHeader, typeof authHeader )
//     if (!authHeader) {
//       response.statusCode = STATUS_CODE.FORBIDDEN;
//       throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
//     }

//     const verificationResponse = jwt.verify(authHeader, secret);

//     req.otpData = JSON.parse(JSON.stringify(verificationResponse));
//     next();
//     return true;
//   } catch (error) {
//     console.log('error --->>>', error)
//     next(error);
//     return false;
//   }
// }

// export default otpAuthMiddleware;
