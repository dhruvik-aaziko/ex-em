export interface UploadToS3WithPrefixData {
  file: any;
  folderName: string;
  isLocalFile: boolean;
  fileNamePrefix: string; 
}

export interface uploadToS3WithCustomNameData {
  file: any;
  folderName: string;
  isLocalFile: boolean;
  customFileName: string; 
}