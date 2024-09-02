import ConfigEnvironment from '../interfaces/config.interface';

const DEVELOPMENT = (): ConfigEnvironment => {
  const {
    PORT,
    MONGO_SRV_EXEM,
    MONGO_DB_EXEM,
    JWT_SECRET,
    NODE_ENV,
    HTTPS_KEY,
    HTTPS_CERT,
   
  } = process.env;

  return {
    NODE_ENV: NODE_ENV ? NODE_ENV : 'development',
    PORT: PORT ? Number(PORT) : 3000,

    // * DB CONFIG
    MONGO_SRV_EXEM: MONGO_SRV_EXEM ? MONGO_SRV_EXEM : '',
    MONGO_DB_EXEM : MONGO_DB_EXEM ? MONGO_DB_EXEM :'',

    JWT_SECRET: JWT_SECRET ? JWT_SECRET : '',

    
    // * SERVER CONFIG
    HTTPS_KEY: HTTPS_KEY || '',
    HTTPS_CERT: HTTPS_CERT || '',

   

   
  };
};

export default DEVELOPMENT;
