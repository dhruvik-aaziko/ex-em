const { transports } = require('winston');
import level from './level';
import format from './format';

/**
 * config for production
*/
let config: any;
const mydate = new Date();
const newFilename = mydate.getFullYear() + '-' + mydate.getMonth() + '-' + mydate.getDate();
const ENVIRONMENT = process.env.NODE_ENV;

if (ENVIRONMENT == 'PRODUCTION') {

  config = {
    level,
    format,
    transports: [
      new transports.Console({ level: 'debug' }),
      new transports.File({ filename: './logs/error.log', level: 'error' }),
      new transports.File({
        handleExceptions: true,
        filename: `./logs/${newFilename}.log`,
        level: 'debug'
      }),
    ],
  };

}
else {
  config = {
    level,
    format,
    transports: [
      new transports.Console({ level: 'debug' }),
      new transports.File({ filename: './logs/error.log', level: 'error' }),
      new transports.File({
        handleExceptions: true,
        filename: `./logs/${newFilename}.log`,
        level: 'debug'
      }),
    ],
  };
}
export = config;
