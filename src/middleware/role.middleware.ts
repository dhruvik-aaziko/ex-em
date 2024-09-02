import { NextFunction, Response, Request } from 'express';
import { ERROR_MESSAGES, STATUS_CODE,USER_CONSTANT } from '../constants';
import getconfig from '../config';
import { RequestWithAdmin } from '../interfaces/requestWithAdmin.interface';

function hasRole(allowedRoles: string[], allowedPermission?: string) {
  const roleMiddleware = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<boolean> => {
    try {
      const req = request as RequestWithAdmin;
      const user =  req.user
      const agentRoles = USER_CONSTANT.AGENT_ROLES_ARRAY;

       
        if (user.role == USER_CONSTANT.ROLES.superAdmin ) {
          
          next();
          return true;
        } else if(agentRoles.includes(user.role) && allowedPermission){
          
          const permissionArray = allowedPermission.split('.');
          const module = permissionArray[0];
          const property = permissionArray[1];
          console.log(user && user.adminUserPermission)
          console.log(user.adminUserPermission[module] && user.adminUserPermission[module][property])
          console.log(user && user.adminUserPermission && user.adminUserPermission[module] && user.adminUserPermission[module][property])
          if (user && user.adminUserPermission && user.adminUserPermission[module] && user.adminUserPermission[module][property]) {
           
            next();
            return true;
          } else {
            
            response.statusCode = STATUS_CODE.NON_AUTHORITATIVE_INFORMATION;
            throw new Error(ERROR_MESSAGES.NOT_ACCESS);
          }

        }else {
          response.statusCode = STATUS_CODE.NON_AUTHORITATIVE_INFORMATION;
          throw new Error(ERROR_MESSAGES.NOT_ACCESS);
        }
    } catch (error) {
      next(error);
      return false;
    }
  }
 
  return roleMiddleware;
}
  export default hasRole;