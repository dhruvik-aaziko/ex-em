import { Router, Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { COMMON_CONSTANT, ERROR_MESSAGES, MAIL_CONFIG, NUMERICAL, PERMISSIONS, ROUTES, STATUS_CODE, SUCCESS_MESSAGES, USER_CONSTANT } from "../../constants";
import Controller from "../../interfaces/controller.interface";
import AdminValidation from "./admin.validation";
import logger from "../../logger";
import { successMiddleware } from "../../middleware/response.middleware";
import { Admin, UpdateAdmin } from './admin.interface';
import adminModel from './admin.model';
import getconfig from '../../config';
import * as bcrypt from 'bcrypt';
import commonUtils from "../../common";
import authMiddleware from '../../middleware/auth.middleware';
import hasRole from '../../middleware/role.middleware';
import { MongoService } from '../../utils/mongoService';
import { RequestWithAdmin } from '../../interfaces/requestWithAdmin.interface';
import TokenData from '../../interfaces/tokenData.interface';
import DataStoredInToken from '../../interfaces/dataStoredInToken';
import { sendEmail } from '../../utils/sendMail';
const { MONGO_DB_EXEM, JWT_SECRET } = getconfig();

class adminController implements Controller {
  public path = `/${ROUTES.ADMIN}`;
  public router = Router();
  private validation = new AdminValidation();
  private Admin = adminModel;


  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {

    this.router.post(
      `/superAdmin`,
      this.validation.createAdminValidation(),
      this.createSuperAdmin
    );

    this.router.post(
      `${this.path}`,
      authMiddleware,
      hasRole([USER_CONSTANT.ROLES.admin], PERMISSIONS.ADMINUSER_CREATOR),
      this.validation.createAdminValidation(),
      this.createAdmin
    );

    this.router.post(
      `${this.path}/adminLogin`,
      this.validation.loginAdminValidation(),
      this.adminLoggingIn
    );

    this.router.get(
      `${this.path}/get`,
      authMiddleware,
      hasRole([USER_CONSTANT.ROLES.admin], PERMISSIONS.ADMINUSER_VIEWER),
      this.getAdmin
    );

    this.router.put(
      `${this.path}/:id`,
      authMiddleware,
      hasRole([USER_CONSTANT.ROLES.admin], PERMISSIONS.ADMINUSER_EDITOR),
      this.validation.updateAdminValidation(),
      this.updateAdmin
    );

    this.router.put(
      `${this.path}/isActive/:id`,
      authMiddleware,
      hasRole([USER_CONSTANT.ROLES.admin], PERMISSIONS.ADMINUSER_EDITOR),
      this.validation.updateAdminStatusValidation(),
      this.updateAdminStatus
    );

    this.router.delete(
      `${this.path}`,
      authMiddleware,
      hasRole([USER_CONSTANT.ROLES.admin], PERMISSIONS.ADMINUSER_REMOVER),
      this.validation.deleteAdminValidation(),
      this.deleteAdmin
    );

    this.router.post(
      `${this.path}/forgotPassword`,
      this.validation.forgotPasswordValidation(),
      this.forgotPassword
    );

    this.router.post(
      `${this.path}/resetPassword`,
      this.validation.resetPasswordValidation(),
      this.resetPassword
    );

    this.router.post(
      `${this.path}/changePassword`,
      authMiddleware,
      this.validation.changePasswordValidation(),
      this.changePassword
    );

    this.router.post(
      `${this.path}/logout`,
      authMiddleware,
      this.logoutApp
    );

    this.router.get(
      `${this.path}/allModule`,
      authMiddleware,
      this.getAllModule
    );

    /** get all admin */

    this.router.get(
      `${this.path}/allAdmin`,
      //authMiddleware,
      this.getAllAdmin
    );

  }

  private createSuperAdmin = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      let { name, lastName, email, role, password, adminUserPermission } = request.body;


      let admin: Admin = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { email: email }
      })

      if (admin) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.ALREADY_CREATED.replace(':attribute', 'SuperAdmin'));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const adminData: Admin = await MongoService.create(MONGO_DB_EXEM, this.Admin, {
        insert: {
          name: name,
          lastName: lastName,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: role,
          adminUserPermission: adminUserPermission
        }
      });

      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'SuperAdmin'),
          data: adminData
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`There was an issue into creating superAdmin.: ${error}`);
      return next(error);
    }

  };

  private createAdmin = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      let { name, lastName, email, role, password, adminUserPermission, department } = request.body;


      let admin: Admin = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { email: email }
      })

      if (admin) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.ALREADY_CREATED.replace(':attribute', 'admin'));
      }


      //  let department: Department = await MongoService.findOne(MONGO_DB_EXEM, this.department, {
      //   query: { _id: request.params.id }
      // })

      // if (!department) {
      //   response.statusCode = STATUS_CODE.BAD_REQUEST;
      //   throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'department'));
      // }
      const hashedPassword = await bcrypt.hash(password, 10);

      const adminData: Admin = await MongoService.create(MONGO_DB_EXEM, this.Admin, {
        insert: {
          name: name,
          lastName: lastName,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: role,
          adminUserPermission: adminUserPermission,
          // department:department._id

        }
      });
      console.log("----------adminData", adminData)
      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'Admin'),
          data: adminData
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`There was an issue into creating admin.: ${error}`);
      return next(error);
    }

  };
//change
  private adminLoggingIn = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { email, password } = request.body;

      let admin: Admin = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { email: email }
      })

      if (!admin) {
        response.statusCode = STATUS_CODE.NOT_FOUND;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'Admin'));
      }
   console.log(admin);
   
      const chekAdminLogin = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { _id: admin._id },
        select: 'isActive'
      });

      console.log("check status", chekAdminLogin)
      if (chekAdminLogin.isActive === true) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.ALREADY_LOGIN.replace(':attribute', 'admin'));
      }

      const isPasswordMatching = await bcrypt.compare(password, admin.password);
      if (!isPasswordMatching) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.PASSWORD_NOT_MATCH);
      }

      const token = await commonUtils.createNeverExpireToken(admin._id);

      await MongoService.findOneAndUpdate(MONGO_DB_EXEM, this.Admin, {
        query: { _id: admin._id },
        updateData: { $set: { token: token, isActive: true } }
      })

      const responseData = {
        adminData: {
          _id: admin._id,
          email: admin.email,
          name: admin.name,
          lastName: admin.lastName,
          role: admin.role,

        },
        tokenData: token,
      };

      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.LOGIN_SUCCESSFULLY,
          data: responseData
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error in admin login ${error}`);
      return next(error);
    }
  };

  private getAdmin = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      let { isActive, searchText, start, limit } = request.body;

      const pageStart = start ? start : 0;
      const pageLimit = limit ? limit : 10;

      let query = {}

      if (searchText) {
        const regex = { $regex: new RegExp('^' + searchText + '', 'i') };

        query = {
          ...query,
          $or: [
            {
              name: regex
            },
            {
              lastName: regex
            },
            {
              email: regex
            },
          ]
        };
      }

      if (isActive == true) {
        query = { ...query, isActive: isActive, role: USER_CONSTANT.ROLES.admin }
      } else if (isActive == false) {
        query = { ...query, isActive: isActive, role: USER_CONSTANT.ROLES.admin }
      }

      console.log(Object.keys(query).length)
      if (Object.keys(query).length === NUMERICAL.ZERO) {
        query = { ...query, role: USER_CONSTANT.ROLES.admin }
      }
      console.log("======>>>>>>", query)
      const admin = await MongoService.pagination(MONGO_DB_EXEM, adminModel, {
        query,
        select: "name email isActive role lastName",
        offset: pageStart,
        limit: pageLimit,
        sort: { createdAt: -1 }
      })

      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'Admin'),
          data: admin
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`There was an issue into fetcging all Admin.: ${error}`);
      return next(error);
    }

  };

  private updateAdmin = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      let { name, lastName } = request.body;

      let admin: Admin = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { _id: request.params.id }
      })

      if (!admin) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'admin'));
      }

      const adminData: Admin = await MongoService.findOneAndUpdate(MONGO_DB_EXEM, this.Admin, {
        query: { _id: request.params.id },
        updateData: {
          $set: { name: name, lastName: lastName }
        }
      });

      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.UPDATE_SUCCESS.replace(':attribute', 'Admin'),
          data: adminData
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`There was an issue into update admin.: ${error}`);
      return next(error);
    }

  };

  private updateAdminStatus = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      let { isActive } = request.body;

      let admin: Admin = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { _id: request.params.id }
      })

      if (!admin) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'admin'));
      }
      

      const adminData: Admin = await MongoService.findOneAndUpdate(MONGO_DB_EXEM, this.Admin, {
        query: { _id: request.params.id },
        updateData: {
          $set: { isActive: isActive }
        }
      });

      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.UPDATE_SUCCESS.replace(':attribute', 'AdminStatus'),
          data: adminData
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`There was an issue into update admin status.: ${error}`);
      return next(error);
    }

  };

  private deleteAdmin = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      let { adminId } = request.body;

      let admin: Admin = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { _id: adminId }
      })

      if (!admin) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'admin'));
      }

      await MongoService.deleteOne(MONGO_DB_EXEM, this.Admin, {
        query: { _id: adminId },
      });

      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.DELETE_SUCCESS.replace(':attribute', 'Admin'),
          data: {}
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`There was an issue into remove admin.: ${error}`);
      return next(error);
    }

  };

  private forgotPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { email, isEmail } = request.body;
      const link = `${process.env.FRONTEND_HOST_URL}${COMMON_CONSTANT.FRONTEND_RESET_PASSWORD_ROUTE}`;

      /* email send for forgot password */
      if (isEmail) {
        const admin = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
          query: { email }
        });

        if (!admin) {
          response.statusCode = STATUS_CODE.NOT_FOUND;
          throw new Error(ERROR_MESSAGES.COMMON.NOT_EXISTS.replace(':attribute', 'email'));
        }
        const tokenData = this.createToken(admin._id);

        const resetLink = `${link}/${email}/${tokenData.token}`;
        const subject = MAIL_CONFIG.SUBJECT.RESET_PASSWORD;
        const body = `<h3>Using below link you can change your password.</h3><br/> Reset Password Link : ${resetLink}`
        const mailInfo = await sendEmail(email, subject, body)

        return successMiddleware(
          {
            message: SUCCESS_MESSAGES.MAIL_SENT_SUCCESS,
            data: email
          },
          request,
          response,
          next
        );

      }

    } catch (error) {
      logger.error(`There was an issue into forgot password.:  ${error}`);
      return next(error);
    }
  };

  private resetPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { resetToken, password } = request.body;

      // verify token
      const verificationResponse = jwt.verify(
        resetToken,
        JWT_SECRET
      ) as DataStoredInToken;
      logger.info(`Verified verificationResponse :: ${verificationResponse}`);
      const tokenUserId = verificationResponse._id;

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // update password
      const updatedAdmin = await MongoService.findOneAndUpdate(MONGO_DB_EXEM, this.Admin, {
        query: { _id: tokenUserId },
        updateData: { password: hashedPassword }
      });

      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.USER_PASSWORD_CHANGE_SUCCESS,
          data: updatedAdmin
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`There was an issue into reset password.:  ${error}`);
      return next(error);
    }
  };

  private changePassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const req = request as RequestWithAdmin;
      const adminId = req.user._id;
      const { oldPassword, password } = request.body;
      const user = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { _id: adminId },
        select: 'password',
        lean: false
      });

      if (user) {
        const isPasswordMatching = await bcrypt.compare(
          oldPassword,
          user.password
        );
        if (!isPasswordMatching) {
          response.statusCode = STATUS_CODE.BAD_REQUEST;
          throw new Error(ERROR_MESSAGES.PASSWORD_NOT_MATCH);
        } else {
          const hashedPassword = await bcrypt.hash(password, 10);

          const updatePassword = await MongoService.findOneAndUpdate(MONGO_DB_EXEM, this.Admin, {
            query: { _id: adminId },
            updateData: {
              $set: { password: hashedPassword }
            }
          })

          return successMiddleware(
            {
              message: SUCCESS_MESSAGES.USER_PASSWORD_CHANGE_SUCCESS,
              data: null
            },
            request,
            response,
            next
          );
        }
      } else {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.PASSWORD_NOT_MATCH);
      }
    } catch (error) {
      logger.error(
        `There was an issue into changing a user's password.: ${error}`
      );
      return next(error);
    }
  };

  private createToken(userId: string): TokenData {
    const expiresIn = 1 * 60 * 60;
    // const expiresIn = 5 * 60; // 5 minutes temporary for test
    const dataStoredInToken: DataStoredInToken = {
      _id: userId
    };
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, JWT_SECRET, { expiresIn })
    };
  }

  private logoutApp = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const req = request as RequestWithAdmin;
      const adminId = req.user._id;
      
      await MongoService.findOneAndUpdate(MONGO_DB_EXEM, this.Admin, {
        query: { _id: adminId },
        updateData: { token: "", isActive: false } // Ensure isActive is a boolean
      });
      
      // const adminData: Admin = await MongoService.findOneAndUpdate(MONGO_DB_EXEM, this.Admin, {
      //   query: { _id: request.params.id },
      //   updateData: {
      //     $set: { isActive: false }
      //   }
      // });

      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.LOGOUT_SUCCESSFULLY,
          data: {}
        },
        request,
        response,
        next
      );

    } catch (error) {
      logger.error(`There was an issue into logout.:  ${error}`);
      return next(error);
    }
  };

  private getAllModule = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      const req = request as RequestWithAdmin;
      const adminId = req.user._id;

      let adminModuleData = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { _id: adminId },
      });

      if (!adminModuleData) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'admin'));
      }

      let moduleAcsess = adminModuleData.adminUserPermission
      console.log("moduleAcsess=------", moduleAcsess)
      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'Admin'),
          data: moduleAcsess
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`There was an issue into fetch getAllModule.: ${error}`);
      return next(error);
    }

  };





  private getAllAdmin = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      const req = request as RequestWithAdmin;


      let allAdminData = await MongoService.find(MONGO_DB_EXEM, this.Admin, {
        query: { role: "admin" },
        select: 'name _id'
      });




      if (!allAdminData) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'admin'));
      }


      console.log("moduleAcsess=------", allAdminData)
      return successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'Admin'),
          data: allAdminData
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`There was an issue into fetch getAllModule.: ${error}`);
      return next(error);
    }

  };

}

export default adminController;