import * as fs from 'fs';

export const removeFile = (path: string): void => {
  return fs.unlinkSync(path);
};


