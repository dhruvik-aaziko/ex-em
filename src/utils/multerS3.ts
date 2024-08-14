// import multer from 'multer';
// import multerS3 from 'multer-s3';
// import * as AWS from "aws-sdk";

// // Configure AWS SDK
// AWS.config.update({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_REGION,
// });

// const s3 = new AWS.S3();

// const upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: process.env.S3_BUCKET_NAME,
//         acl: 'public-read',
//         metadata: function (req: any, file: any, cb: any) {
//             cb(null, { fieldName: file.fieldname });
//         },
//         key: function (req: any, file: any, cb: any) {
//             const datetimestamp = Date.now();
//             const uniqueSuffix = '-' + datetimestamp + '-' + Math.floor(Math.random() * 9000 + 1000);
//             const fileExtension = file.mimetype.split('/').pop();
//             cb(null, file.fieldname + uniqueSuffix + '.' + fileExtension);
//         }
//     })
// });


// const uploadHandler = (fields: any) => upload.fields(fields);

// module.exports = uploadHandler;
