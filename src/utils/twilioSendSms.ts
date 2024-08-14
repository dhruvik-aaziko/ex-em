import twilio from "twilio";
import logger from "../logger";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const sendTwilioOtpMessage = async (to: string, body: string) => {
    try {
        const message = await client.messages.create({
            body: body,
            from: twilioPhoneNumber,
            to: to
        });
        logger.info(` Message sent :-->> ${JSON.stringify(message)}`);
        logger.info(` Message sent : ${message.sid}`);
        return true;
    } catch (error) {
        logger.error(' Error sending OTP : ', error);
        return false;
    }
};