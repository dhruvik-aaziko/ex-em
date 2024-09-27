import * as AWS from "aws-sdk";
import path from "path";
import * as fs from "fs";
import { UploadToS3WithPrefixData, uploadToS3WithCustomNameData } from '../interfaces/common.interface';
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';
const ACCESS_KEY = process.env.AWS_ACCESS_KEY || '';
const SECRET_SECRET = process.env.AWS_SECRET_KEY || '';
// const BUCKET_REGION = process.env.AWS_BUCKET_REGION || 'us-east-1'
const BUCKET_REGION = process.env.AWS_BUCKET_REGION || 'blr1'
// const s3bucket = new AWS.S3({
//   accessKeyId: ACCESS_KEY,
//   secretAccessKey: SECRET_SECRET
// });
const s3bucket = new AWS.S3({
  endpoint: "https://blr1.digitaloceanspaces.com",
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_SECRET,
  },
});
export function uploadToS3(file: any, folderName: string, isLocalFile?: boolean): Promise<any> {
  const fileName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
  let bodyData = file.buffer;
  if (isLocalFile) {
    bodyData = fs.readFileSync(file.path);
  }
  const params = {
    Bucket: BUCKET_NAME,
    Key: "aaziko/" + folderName + "/" + fileName,
    Body: bodyData,
    ACL: 'public-read', // Ensure ACL is set to public-read
    ContentType: file.mimetype
  };
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, function (err: any, data: any) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}
export function uploadToS3InPng(file: any, folderName: string, isLocalFile?: boolean): Promise<any> {
  const fileName = file.fieldname + '-' + Date.now() + '.png'
  let bodyData = file.buffer;
  if (isLocalFile) {
    bodyData = fs.readFileSync(file.path);
  }
  const params = {
    Bucket: BUCKET_NAME,
    Key: "aaziko/" + folderName + "/" + fileName,
    Body: bodyData,
    ACL: 'public-read', // Ensure ACL is set to public-read
    ContentType: file.mimetype
  };
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, function (err: any, data: any) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}
export function uploadLogFileToS3(filePath: any, fileName: any, folderName: string, isLocalFile?: boolean): Promise<any> {
  let bodyData = fs.readFileSync(filePath)
  const params = {
    Bucket: BUCKET_NAME,
    Key: "aaziko/" + folderName + "/" + fileName,
    Body: bodyData,
    ACL: 'public-read', // Ensure ACL is set to public-read
  };
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, function (err: any, data: any) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}
export function uploadToS3InPdf(file: any, folderName: string): Promise<any> {
  const fileName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
  let bodyData = file.buffer;
  const params = {
    Bucket: BUCKET_NAME,
    Key: "aaziko/" + folderName + "/" + fileName,
    Body: bodyData,
    ACL: 'public-read', // Ensure ACL is set to public-read
    ContentType: file.mimetype
  };
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, function (err: any, data: any) {
      if (err) {
        return reject(err);
      }
      // console.log('uploadToS3 :: data :: ', data)
      return resolve(data);
    });
  });
}
export function uploadFileToS3(file: any, folderName: string, fileName: string): Promise<any> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: "aaziko/" + folderName + "/" + fileName,
    Body: file,
    ACL: 'public-read', // Ensure ACL is set to public-read
    ContentType: file.mimetype
  };
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, function (err: any, data: any) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}
export function getFileFromS3(key: string): Promise<any> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };
  return new Promise((resolve, reject) => {
    s3bucket.getObject(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        console.log("Successfully dowloaded data from  bucket");
        resolve(data);
      }
    });
  });
}
export function deleteFromS3(key: string): Promise<any> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };
  return new Promise((resolve, reject) => {
    console.log("im here " ,key);
    
    s3bucket.deleteObject(params, function (err: any, data: any) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}
export function uploadToS3WithPrefix(data: UploadToS3WithPrefixData): Promise<any> {
  const file = data.file;
  const folderName = data.folderName;
  const isLocalFile = data.isLocalFile;
  const fileNamePrefix = data.fileNamePrefix;
  const fileName = fileNamePrefix + '-' + Date.now() + path.extname(file.originalname);
  let bodyData = file.buffer;
  if (isLocalFile) {
    bodyData = fs.readFileSync(file.path);
  }
  const params = {
    Bucket: BUCKET_NAME,
    Key: "aaziko/" + folderName + "/" + fileName,
    Body: bodyData,
    ACL: 'public-read', // Ensure ACL is set to public-read
    ContentType: file.mimetype
  };
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, function (err: any, data: any) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}
export function uploadToS3WithCustomName(data: uploadToS3WithCustomNameData): Promise<any> {
  const file = data.file;
  const folderName = data.folderName;
  const isLocalFile = data.isLocalFile;
  const customFileName = data.customFileName;
  const fileName = customFileName + path.extname(file.originalname);
  let bodyData = file.buffer;
  console.log('file : ', file);
  if (isLocalFile) {
    bodyData = fs.createReadStream(file.path);
  }
  const params = {
    Bucket: BUCKET_NAME,
    Key: "aaziko/" + folderName + "/" + fileName,
    Body: bodyData,
    ACL: 'public-read',
    Metadata: { "Content-Type": file.mimetype },
  };
  console.log('params : ', params);
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, function (err: any, data: any) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}