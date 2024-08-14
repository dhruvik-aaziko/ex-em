import path from 'path';
import Jimp from 'jimp';
import { IMAGE_CONSTANT } from '../constants';
import logger from '../logger';

const multiFilesSize = async (files: any) => {
  try {
    const MAX_FILE_SIZE = IMAGE_CONSTANT.IMAGE_FILE_SIZE * 1024 * 1024;
    const compressImagePaths: string[] = [];

    if (files && files.length > 0) {
      await Promise.all(files.map(async (file: any) => {
        if (file.mimetype !== 'image/webp' && file.size <= MAX_FILE_SIZE) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 9000 + 1000);
          const extension = file.mimetype.split('/')[1];
          const filename = `${file.fieldname}${timestamp}${random}.${extension}`;
          const compressImagePath: string = path.join(__dirname, '../../uploads', filename);

          const image = await Jimp.read(file.path);
          image.resize(IMAGE_CONSTANT.IMAGE_FILE_COMRESS.resize, Jimp.AUTO);
          image.quality(IMAGE_CONSTANT.IMAGE_FILE_COMRESS.quality);
          await image.writeAsync(compressImagePath);

          compressImagePaths.push(compressImagePath);
        }
      }));
    }

    return compressImagePaths;
  } catch (error) {
    console.log('Compress Image Error======', error);
    logger.error(`There was an issue into compressing file .: ${error}`);
    return [];
  }
}

export default multiFilesSize;
