// import { NextFunction, Response, Request } from 'express';
// import RequestWithUser from '../interfaces/requestWithUser.interface';
// import { ERROR_MESSAGES, STATUS_CODE } from '../constants';

// function hasRole(allowedRoles: string[]) {
//   const roleMiddleware = async (
//     request: Request,
//     response: Response,
//     next: NextFunction
//   ): Promise<boolean> => {
//     try {
//       const req = request as RequestWithUser;
//       const user = req.user;

//       // if (allowedRoles.includes(user.selectOrganizationRole)) {
//         next();
//         return true;
//       // }
//       // else {
//       //   response.statusCode = STATUS_CODE.NON_AUTHORITATIVE_INFORMATION;
//       //   throw new Error(ERROR_MESSAGES.NOT_ACCESS);
//       // }
//     } catch (error) {
//       next(error);
//       return false;
//     }
//   };

//   return roleMiddleware;
// }

// export default hasRole;
