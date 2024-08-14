import ConfigEnvironment from '../interfaces/config.interface';
import development from './development.config';
import production from './production.config';
import { ENVIRONMENT } from '../constants';

const   getconfig = (): ConfigEnvironment => {
  if (process.env.NODE_ENV === ENVIRONMENT.DEVELOPMENT) {
    return development();
  } else if (process.env.NODE_ENV === ENVIRONMENT.PRODUCTION) {
    return production();
  } else {
    return development();
  }
};

export default getconfig;
