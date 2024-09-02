import { NextFunction, Response, Request } from 'express';
import * as jwt from 'jsonwebtoken';
import DataStoredInToken from '../interfaces/dataStoredInToken';
import { RequestWithAdmin } from '../interfaces/requestWithAdmin.interface';
import { ERROR_MESSAGES, STATUS_CODE } from '../constants';
import getconfig from '../config';
import adminModel from '../api/admin/admin.model';
import { MongoService } from '../utils/mongoService';
const { JWT_SECRET, MONGO_DB_EXEM } = getconfig();

async function authMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
): Promise<boolean> {
    try {
        const Admin = adminModel;
        const req = request as RequestWithAdmin;
        const secret = JWT_SECRET;

        const authHeader = req.headers.authorization as string;
        if (!authHeader) {
            response.statusCode = STATUS_CODE.FORBIDDEN;
            throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
        }

        const verificationResponse = jwt.verify(
            authHeader,
            secret
        ) as DataStoredInToken;
        const _id = verificationResponse;

        const user = await MongoService.findOne(MONGO_DB_EXEM, Admin, {
            query: { _id }
        });

       
        if (!user) {
            response.statusCode = STATUS_CODE.FORBIDDEN;
            throw new Error(ERROR_MESSAGES.TOKEN_EXPIRED);
        }

        if(!user.isActive){
            response.statusCode = STATUS_CODE.FORBIDDEN;
            throw new Error(ERROR_MESSAGES.DEACTIVE_USER); 
        }
        req.user = user;
        next();
        return true;
    } catch (error) {
        next(error);
        return false;
    }
}

export default authMiddleware;  
