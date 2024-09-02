import fs from 'fs';
import path from 'path';
import * as jwt from 'jsonwebtoken';
import converter from "number-to-words";
import { uploadToS3 } from '../utils/s3';
import { AUTHENTICATION_CONSTANT, EMPTY } from '../constants';
import DataStoredInToken from '../interfaces/dataStoredInToken';
import TokenData from '../interfaces/tokenData.interface';
import getconfig from '../config';
import adminModel from '../api/admin/admin.model';
import { MongoService } from '../utils/mongoService';
import moment from 'moment';

const { JWT_SECRET, MONGO_DB_EXEM,  } = getconfig();


class CommonUtils {
  static instance: CommonUtils;
  public Admin = adminModel;


  constructor() {
    if (CommonUtils.instance) {
      return CommonUtils.instance;
    }
    CommonUtils.instance = this;
  }

  public generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public generateRandomNumberLength(length: number): String {
    let randomNumber = '';
    const randomString = '123456789123456789123456789123456789123456789';

    for (let i = 1; i <= length; i++) {
      const char = Math.floor(Math.random() * randomString.length + 1);
      randomNumber += randomString.charAt(char)
    }

    return randomNumber;
  }

  public async getRandomProfileImage() {
    const imagePath = path.join(__dirname, AUTHENTICATION_CONSTANT.DEFAULT_PROFILE_IMAGE_UPLOADS_PATH, 'profilePicture');

    let files = fs.readdirSync(imagePath);
    const file = files[this.generateRandomNumber(0, files.length - 1)];

    let filePath = path.join(imagePath, file);
    const fileObj = {
      path: filePath,
      fieldname: 'ProfileImages',
      originalname: file
    };

    const uploadResult = await uploadToS3(fileObj, 'ProfileImages', true);

    const profileImage = uploadResult.Location;
    const profileImageKey = uploadResult.imageKey;

    return {
      profileImage,
      profileImageKey
    };
  }

  public generateRandomPassword(passlength: number): String {
    let pass = '';
    const randomString = 'ABCDEFGHJKMNPQRSTUVWXYZ' + 'abcdefghjkmnpqrstuvwxyz123456789';

    for (let i = 1; i <= passlength; i++) {
      const char = Math.floor(Math.random() * randomString.length + 1);
      pass += randomString.charAt(char)
    }

    return pass;
  }

  public generateRandomUserName(userNamelength: number): String {
    let userName = '';
    const randomString = 'ABCDEFGHJKMNPQRSTUVWXYZ' + '123456789';

    for (let i = 1; i <= userNamelength; i++) {
      const char = Math.floor(Math.random() * randomString.length + 1);
      userName += randomString.charAt(char)
    }

    return userName;
  }

  public async getUniquePhoneNumber() {
    let phoneNumber = '';

    while (true) {
      phoneNumber = await this.generateRandomNumberLength(10).toString();

      const isUser = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { phoneNumber: { $regex: new RegExp(`^${phoneNumber}$`), $options: 'i' } }
      });

      if (!isUser) {
        break;
      }
    }

    return phoneNumber;
  }

  public async getUniqueUserName() {
    let userName = '';

    while (true) {
      userName = await this.generateRandomUserName(10).toString();

      const isUser = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
        query: { fullName: { $regex: new RegExp(`^${userName}$`), $options: 'i' } }
      });

      if (!isUser) {
        break;
      }
    }

    return userName;
  }

  public async getUniqueOtp(length: number) {
    let otp: any = '';

    while (true) {
      otp = await this.generateRandomNumberLength(length);
      if (otp.length == length) {
        break;
      }
    }
    return otp;
  }

  public async getOtpTimeValid(timeOut: number) {

    let minutes = timeOut * 60 * 1000;
    let currentDate = new Date().getTime();
    let otpValidTime = new Date(currentDate + minutes).toString();

    return otpValidTime;
  }

  public async findLastUserId() {
    const lastUser = await MongoService.findOne(MONGO_DB_EXEM, this.Admin, {
      sort: { _id: -1 }
    })
    if (lastUser == null || lastUser.userId == EMPTY) {
      return "AAAA0000";
    }

    // If no user exists, return a default ID
    let lastUserId = lastUser.userId;
    let number = parseInt(lastUserId.slice(4), 10);
    if (number < 9999) {
      number++; // Increment if the number is less than 9999
    } else {
      // Handle prefix incrementation if needed
      let prefix: any = lastUserId.slice(0, 4);
      prefix = this.incrementPrefix(prefix);
      number = 1;
      lastUserId = `${prefix}${number.toString().padStart(4, "0")}`;
    }
    return lastUserId;
  }

  public async generateNextUserId(lastUserId: string) {
    let prefix: any = lastUserId.slice(0, 4);
    let number = parseInt(lastUserId.slice(4), 10);
    number++;
    if (number > 9999) {
      number = 1;
      prefix = this.incrementPrefix(prefix); // Assuming you have an incrementPrefix function
    }
    return `${prefix}${number.toString().padStart(4, "0")}`;
  }

  public async incrementPrefix(prefix: any): Promise<any> {
    const chars = prefix.split("");
    for (let i = chars.length - 1; i >= 0; i--) {
      if (chars[i] < "Z") {
        chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
        return chars.join("");
      }
      chars[i] = "A";
    }
    return "AA"; // This case happens when prefix is 'ZZ' and needs to roll over
  };

  public async createNeverExpireToken(userId: string) {
    const dataStoredInToken: DataStoredInToken = {
      _id: userId
    };
    return jwt.sign(dataStoredInToken, JWT_SECRET);
  }

  public async createToken(otpAuthObject: any): Promise<TokenData> {
    const expiresIn = 60 * 60; // an hour
    const secret = JWT_SECRET;
    return {
      expiresIn,
      token: jwt.sign(otpAuthObject, secret, { expiresIn })
    };
  }

  public async convertAmountToWords(countryCode: string, amount: number): Promise<string> {
    // Convert the amount to words
    let words = converter.toWords(amount);

    // Convert to uppercase and prepend "USD"
    let formattedWords = `${countryCode} ${words.toUpperCase()}`;

    return formattedWords;
  }

  public async isValidDate(value: string): Promise<boolean> {
    const valueDate = moment(value);
    return valueDate.isValid();
  };

  

  public async generateNextInspectorUserId(lastUserId: string) {
    let prefix: any = lastUserId.slice(0, 2);
    let number = parseInt(lastUserId.slice(2), 10);
    number++;
    if (number > 999999) {
      number = 1;
      prefix = this.incrementPrefix(prefix); // Assuming you have an incrementPrefix function
    }
    return `${prefix}${number.toString().padStart(6, "0")}`;
  }




}

export default new CommonUtils();
