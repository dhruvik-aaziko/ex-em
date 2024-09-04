import * as fs from 'fs';
import { checkManyFilesExists } from './validationFunctions';
import { EMPTY, ERROR_MESSAGES, NUMERICAL } from '../constants';
import { uploadToS3 } from './s3';
import getconfig from '../config';
import multiFilesSize from './multiImageCompress';
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
/* Image Upload */
export async function fileUploadHandle(files: any, fileTasks: any, isCompulsory = true) {
    try {
        const uploadPromises = fileTasks.map(async ({ type, fileArray }: any) => {
            const { [type]: fileList } = await checkManyFilesExists(files, fileArray);
            if (!fileList) {
                if (isCompulsory) {
                    throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', type));
                } else {
                    return [];
                }
            }
            const compressedPaths = await multiFilesSize(fileList);
            return Promise.all(fileList.map(async (file: any, index: any) => {
                // Uncomment and adjust validation if needed
                // await validateFile(res, file, type, COMPANY_CONSTANT.COMPANY_ICON_EXT_ARRAY, maxSizeCompany);
                const fileObj = {
                    path: compressedPaths[index],
                    fieldname: type,
                    originalname: file.originalname
                };
                const uploadResult = await uploadToS3(fileObj, type, true);
                if (!uploadResult) {
                    throw new Error(`There was an issue into uploading ${type} on s3.`);
                }
                // Remove file from local store
                await Promise.all([
                    fs.promises.unlink(compressedPaths[index]),
                    fs.promises.unlink(file.path)
                ]);
                return uploadResult?.Location || EMPTY;
            }));
        });
        const uploadedFiles = await Promise.all(uploadPromises);
        // Build a result object with dynamic keys based on file types
        const result = fileTasks.reduce((acc: any, { type }: any, index: any) => {
            acc[`${type}Pictures`] = uploadedFiles[index];
            return acc;
        }, {});
        return result;
    } catch (error) {
        throw error;
    }
}

/* pdf Upload */
export async function pdfFileUploadHandle(files: any, fileTasks: any, isCompulsory = true) {
    try {
        const uploadPromises = fileTasks.map(async ({ type, fileArray }: any) => {
            const { [type]: fileList } = await checkManyFilesExists(files, fileArray);
            if (!fileList) {
                if (isCompulsory) {
                    throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', type));
                } else {
                    return [];
                }
            }
            return Promise.all(fileList.map(async (file: any, index: any) => {
                // Uncomment and adjust validation if needed
                // await validateFile(res, file, type, COMPANY_CONSTANT.COMPANY_ICON_EXT_ARRAY, maxSizeCompany);
                const uploadResult = await uploadToS3(file, type, true);
                if (!uploadResult) {
                    throw new Error(`There was an issue into uploading ${type} on s3.`);
                }
                // Remove file from local store
                await Promise.all([
                    // fs.promises.unlink(compressedPaths[index]),
                    fs.promises.unlink(file.path)
                ]);
                return uploadResult?.Location || EMPTY;
            }));
        });
        const uploadedFiles = await Promise.all(uploadPromises);
        // Build a result object with dynamic keys based on file types
        const result = fileTasks.reduce((acc: any, { type }: any, index: any) => {
            acc[`${type}Data`] = uploadedFiles[index];
            return acc;
        }, {});
        return result;
    } catch (error) {
        throw error;
    }
}
/* video Upload */
export async function videoFileUploadHandle(files: any, fileTasks: any, isCompulsory = true) {
    try {
        const uploadPromises = fileTasks.map(async ({ type, fileArray }: any) => {
            const { [type]: fileList } = await checkManyFilesExists(files, fileArray);
            if (!fileList) {
                if (isCompulsory) {
                    throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', type));
                } else {
                    return [];
                }
            }
            const compressedPaths = await Promise.all(fileList.map(async (file: any) => {
                if (file.mimetype.startsWith('video/')) {
                    const compressedPath = `${file.path}-compressed.mp4`;
                    await compressVideo(file.path, compressedPath);
                    return compressedPath;
                } else {
                    // Implement your image compression logic or skip for non-video files
                    return file.path;
                }
            }));
            return Promise.all(fileList.map(async (file: any, index: any) => {
                // Uncomment and adjust validation if needed
                // await validateFile(res, file, type, COMPANY_CONSTANT.COMPANY_ICON_EXT_ARRAY, maxSizeCompany);
                const fileObj = {
                    path: compressedPaths[index],
                    fieldname: type,
                    originalname: file.originalname
                };
                const uploadResult = await uploadToS3(fileObj, type, true);
                if (!uploadResult) {
                    throw new Error(`There was an issue into uploading ${type} on s3.`);
                }
                // Remove file from local store
                await Promise.all([
                    fs.promises.unlink(compressedPaths[index]),
                    fs.promises.unlink(file.path)
                ]);
                return uploadResult?.Location || EMPTY;
            }));
        });
        const uploadedFiles = await Promise.all(uploadPromises);
        // Build a result object with dynamic keys based on file types
        const result = fileTasks.reduce((acc: any, { type }: any, index: any) => {
            acc[`${type}Data`] = uploadedFiles[index];
            return acc;
        }, {});
        return result;
    } catch (error) {
        throw error;
    }
}

/* audio Upload */
export async function audioFileUploadHandle(files: any, fileTasks: any, isCompulsory = true) {
    try {
        const uploadPromises = fileTasks.map(async ({ type, fileArray }: any) => {
            const { [type]: fileList } = await checkManyFilesExists(files, fileArray);
            if (!fileList) {
                if (isCompulsory) {
                    throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', type));
                } else {
                    return [];
                }
            }
            const processedPaths = await Promise.all(fileList.map(async (file: any) => {
                if (file.mimetype.startsWith('audio/')) {
                    const compressedPath = `${file.path}-compressed.mp3`;
                    await compressAudio(file.path, compressedPath); // Assuming you have an `compressAudio` function
                    return compressedPath;
                } else {
                    // Implement your image compression logic or skip for non-audio files
                    return file.path;
                }
            }));
            return Promise.all(fileList.map(async (file: any, index: any) => {
                // Uncomment and adjust validation if needed
                // await validateFile(res, file, type, COMPANY_CONSTANT.COMPANY_ICON_EXT_ARRAY, maxSizeCompany);
                const fileObj = {
                    path: processedPaths[index],
                    fieldname: type,
                    originalname: file.originalname
                };
                const uploadResult = await uploadToS3(fileObj, type, true);
                if (!uploadResult) {
                    throw new Error(`There was an issue uploading ${type} to S3.`);
                }
                // Remove file from local store
                await Promise.all([
                    fs.promises.unlink(processedPaths[index]),
                    fs.promises.unlink(file.path)
                ]);
                return uploadResult?.Location || EMPTY;
            }));
        });
        const uploadedFiles = await Promise.all(uploadPromises);
        // Build a result object with dynamic keys based on file types
        const result = fileTasks.reduce((acc: any, { type }: any, index: any) => {
            acc[`${type}Data`] = uploadedFiles[index];
            return acc;
        }, {});
        return result;
    } catch (error) {
        throw error;
    }
}

function compressAudio(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioCodec('libmp3lame') // Change the codec as needed
            .audioBitrate('128k') // Adjust bitrate for compression
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject);
    });
}
function compressVideo(inputPath: string, outputPath: string) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .size('640x?')
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
}