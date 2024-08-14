import ENVIRONMENT from './environment';
import AGENDA_JOB_CONSTANT from './agendaJobConstant';
import SUCCESS_MESSAGES from './successMessages';
import ERROR_MESSAGES from './errorMessages';
import STATUS_CODE from './statusCode';
import NUMERICAL from "./numerical";
import REDIS from "./redis";
import SOCKET from "./socket";
import EVENTS from "./event";
import ROUTES from "./route";
import USER_CONSTANT from "./userConstant";
import COMMON_CONSTANT from "./commonConstant";
import IMAGE_CONSTANT from "./imageConstant";
import AUTHENTICATION_CONSTANT from './authenticationConstant';
import MAIL_CONFIG from './mailConfig';
import OTPLESS from "./otplessConfig";
import COMPANY_CONSTANT from "./companyConstant";
import FILE_BANK_CONSTANT from "./fileBankConstant";
import PRODUCT_CONSTANT from "./productContant";
import PRODUCT_INQUIRY_CONSTANT from "./productInquiryConstant";
import ORDER_CONSTANT from "./orderConstant";
import LSQ_CONSTANT from "./lsqConstant";
import EVENT_CONSTANT from './eventConstant';

const exportObject = Object.freeze({ 
    ENVIRONMENT,
    AGENDA_JOB_CONSTANT,
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    STATUS_CODE,
    NUMERICAL,
    REDIS,
    SOCKET,
    EVENTS,
    ROUTES,
    USER_CONSTANT,
    COMMON_CONSTANT,
    IMAGE_CONSTANT,
    AUTHENTICATION_CONSTANT,
    MAIL_CONFIG,
    OTPLESS,
    COMPANY_CONSTANT,
    FILE_BANK_CONSTANT,
    PRODUCT_CONSTANT,
    PRODUCT_INQUIRY_CONSTANT,
    ORDER_CONSTANT,
    LSQ_CONSTANT,
    EVENT_CONSTANT,
    EMPTY : ""
});

export = exportObject;