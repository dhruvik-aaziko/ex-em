import { createTransport } from 'nodemailer';
import { MAIL_CONFIG } from '../constants';
import logger from '../logger';

// email configuration
export const sendEmail = async (email: any, subject: string, text: string) => {
  const transporter = createTransport({
    // host: MAIL_CONFIG.HOST,
    // port: MAIL_CONFIG.PORT,
    // secure: true,
    service : "gmail",
    auth: {
      user: MAIL_CONFIG.USER,
      pass: MAIL_CONFIG.PASSWORD
    }
  });

  try {
    await transporter.sendMail({
      from: MAIL_CONFIG.FROM,
      to: email,
      subject: subject,
      html: text
    });
  
    logger.info(' Email sent successfully. ');
  } catch (error) {
    logger.error('Error sending email ERROR :', error);
  }
  
};

export const transporter = createTransport({
  host: MAIL_CONFIG.HOST,
  port: MAIL_CONFIG.PORT,
  secure: true,
  auth: {
    user: MAIL_CONFIG.USER,
    pass: MAIL_CONFIG.PASSWORD
  }
});
