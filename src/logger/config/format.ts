const {
  format: { printf, timestamp, combine, colorize, align},
} = require('winston');
const winstonTimestampColorize = require('winston-timestamp-colorize');

const logFormat = printf(
  ({ level, message, timestamp: ts,  }:any) => `${ts} :: ${level} :: ${message}`,
);

export = combine(timestamp(), align(), winstonTimestampColorize({color: 'cyan'}), colorize({all : true}), logFormat);
