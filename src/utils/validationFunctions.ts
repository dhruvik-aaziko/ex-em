import moment from 'moment';
import * as fs from 'fs';
import { ERROR_MESSAGES, STATUS_CODE } from '../constants';
import imageSize from 'image-size';
import path from 'path';



const isValidDate = async (value: string): Promise<boolean> => {
  const valueDate = moment(value);
  return valueDate.isValid();
};

const isValidExtenstion = async (mimetype: string, allowedExtension: string[]): Promise<boolean> => {
  if (allowedExtension.includes(mimetype)) {
    return true;
  } else {
    return false;
  }
};

const isValidFileSize = async (fileSize: number, maxSize: number): Promise<boolean> => {
  if (fileSize <= maxSize) {
    return true;
  } else {
    return false;
  }
};

const isValidDimensions = async (file: any, validWidth: number, validHeight: number): Promise<boolean> => {
  const dimensions = imageSize(file.buffer);
  if (dimensions.width == validWidth && dimensions.height == validHeight) {
    return true;
  } else {
    return false;
  }
};

const checkAllFilesExists = async (files: any, fileNamesArray: string[]): Promise<any> => {
  const responseData: any = {};

  for (let item = 0; item < fileNamesArray.length; item++) {
    const fileName = fileNamesArray[item];
    if (files[fileName]) {
      responseData[fileName] = files[fileName][0];
    }
  }

  return responseData;
};

const checkManyFilesExists = async (files: any, fileNamesArray: string[]): Promise<any> => {
  const responseData: any = [];
  try {
    for (let item = 0; item < fileNamesArray.length; item++) {
      const fileName = fileNamesArray[item];
      if (files[fileName]) {
        responseData[fileName] = files[fileName];
      }
    }
    return responseData;
  } catch (error) {
    console.log('checkManyFilesExists :: error', error)
    return responseData;
  }
};

// const validateFile = async (
//   responseObj: any,
//   file: any,
//   fieldName: string,
//   allowedExtension: string[],
//   maxSizeInMb?: number,
// ) => {
//   let errorMessage = '';
//   let isValidFile = true;
//   responseObj.statusCode = STATUS_CODE.BAD_REQUEST

//   if (!file) {
//     isValidFile = false;
//     errorMessage = ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', fieldName);
//   } else if (file.fieldname != fieldName) {
//     isValidFile = false;
//     errorMessage = ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', fieldName);
//   } else {
//     // Validate extension
//     if (allowedExtension.length > 0) {
//       const extension = path.extname(file.originalname).toLowerCase();
//       const isValidExt = await isValidExtenstion(extension, allowedExtension);

//       if (!isValidExt) {
//         isValidFile = false;
//         errorMessage = ERROR_MESSAGES.COMMON.FILE_TYPE.replace(':attribute', fieldName)
//           .replace(':values', `${allowedExtension.join('/')}`);
//       }
//     }

//     // validaate file size
//     if (maxSizeInMb) {
//       const isValidSize = await isValidFileSize(
//         file.size,
//         maxSizeInMb * 1024 * 1024
//       );

//       if (!isValidSize) {
//         isValidFile = false;
//         errorMessage = ERROR_MESSAGES.COMMON.MAX_FILE_SIZE.replace(':attribute', fieldName)
//           .replace(':value', `${maxSizeInMb.toString()} MB`);
//       }
//     }
//   }

//   if (!isValidFile) {
//     throw new Error(errorMessage);
//   }
// };


const validateFile = async (
  // responseObj: any,
  file: any,
  fieldName: string,
  allowedExtension: string[],
  // maxSizeInMb?: number,
) => {
  let errorMessage = '';
  let isValidFile = true;
  // responseObj.statusCode = STATUS_CODE.BAD_REQUEST

  if (!file) {
    isValidFile = false;
    errorMessage = ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', fieldName);
  } else if (file.fieldname != fieldName) {
    isValidFile = false;
    errorMessage = ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', fieldName);
  } else {
    // Validate extension
    if (allowedExtension.length > 0) {
      const extension = path.extname(file.originalname).toLowerCase();
      const isValidExt = await isValidExtenstion(extension, allowedExtension);

      if (!isValidExt) {
        isValidFile = false;
        errorMessage = ERROR_MESSAGES.COMMON.FILE_TYPE.replace(':attribute', fieldName)
          .replace(':values', `${allowedExtension.join('/')}`);
      }
    }

    // validaate file size
    // if (maxSizeInMb) {
    //   const isValidSize = await isValidFileSize(
    //     file.size,
    //     maxSizeInMb * 1024 * 1024
    //   );

    //   if (!isValidSize) {
    //     isValidFile = false;
    //     errorMessage = ERROR_MESSAGES.COMMON.MAX_FILE_SIZE.replace(':attribute', fieldName)
    //       .replace(':value', `${maxSizeInMb.toString()} MB`);
    //   }
    // }
  }

  if (!isValidFile) {
    await Promise.all([
      fs.promises.unlink(file.path)
  ]);
    throw new Error(errorMessage);
  }
};


export { isValidDate, isValidExtenstion, isValidFileSize, isValidDimensions, validateFile, checkAllFilesExists, checkManyFilesExists };
