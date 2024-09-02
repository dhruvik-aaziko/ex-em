interface ConfigEnvironment {
  PORT: number;
  NODE_ENV: string;

  JWT_SECRET: string;

  MONGO_SRV_EXEM: string;
  MONGO_DB_EXEM: string;


  HTTPS_KEY: any;
  HTTPS_CERT: any;

  
  
}

export default ConfigEnvironment;
