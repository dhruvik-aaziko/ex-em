import axios from "axios";
import logger from "../logger";
import { OTPLESS } from '../constants';

// "WHATSAPP", "SMS", "EMAIL"
export const sendOtpFromOtpless = async (body: any) => {
    try {
        const URI = OTPLESS.SEND_OTP_URL;
        const response: any = await sendCurlRequest('post', URI, body);
        logger.info(" sendOtpFromOtpless :: response :: ", response?.data);
        return response.data;
    } catch (error) {
        logger.error(' sendOtpFromOtpless :: ERROR() :: ', error);
        return false;
    }
}

export const resendOtpFromOtpless = async (body: any) => {
    try {
        const URI = OTPLESS.RESEND_OTP_URL;
        const response: any = await sendCurlRequest('post', URI, body);
        logger.info(response.data);
        return response.data;

    } catch (error) {
        logger.error(' resendOtpFromOtpless :: ERROR() :: ', error);
        return false;
    }
}

export const verifyOtpFromOtpless = async (body: any) => {
    try {
        const URI = OTPLESS.VERIFY_OTP_URL;
        const response: any = await sendCurlRequest('post', URI, body);
        logger.info(response.data);
        return response.data;

    } catch (error) {
        logger.error(' verifyOtpFromOtpless :: ERROR() :: ', error);
        return false;
    }
}

export const verifyTokenFromOtpless = async (token: any) => {
    try {
        const URI = OTPLESS.USER_INFO_API;
        const response: any = await sendCurlRequest('post', URI, { token });
        logger.info(response.data);
        return response.data;

    } catch (error) {
        logger.error(' verifyTokenFromOtpless :: ERROR() :: ', error);
        return false;
    }
}

const sendCurlRequest = async (method: any, url: any, body: any = {}) => {
    try {
        console.log('method', method, url, body);
        console.log('url', url);
        const response = await axios({
            method,
            url,
            data: body,
            headers: {
                "Content-Type": "application/json",
                clientId: process.env.OTPLESS_CLIENT_ID,
                clientSecret: process.env.OTPLESS_CLIENT_SECRET,
            },
        });
        return response;
    } catch (error) {
        console.log(' sendCurlRequest  :: error :: ', error)
        logger.error(' sendCurlRequest :: ERROR() :: ', error);
        return false;
    }
};


