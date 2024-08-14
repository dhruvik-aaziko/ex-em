import morgan, { StreamOptions } from 'morgan';
import getconfig from '../config';
import { ENVIRONMENT } from '../constants';
import logger from '../logger';

const { NODE_ENV } = getconfig();

const stream: StreamOptions = {
  write: (message : any) => logger.http(message)
};

const skip = () => {
  const env = NODE_ENV || ENVIRONMENT.DEVELOPMENT;
  return env !== ENVIRONMENT.DEVELOPMENT;
};

const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

export default morganMiddleware;
