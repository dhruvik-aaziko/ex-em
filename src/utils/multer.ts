import multer from 'multer';
import * as path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        const datetimestamp = Date.now();
        const uniqueSuffix = '-' + datetimestamp + '-' + Math.floor(Math.random() * 9000 + 1000);
        const fileExtension = file.mimetype.split('/').pop();
        cb(null, file.fieldname + uniqueSuffix + '.' + fileExtension);
    }
});

const uploadHandler = multer({ storage: storage });

export default uploadHandler;