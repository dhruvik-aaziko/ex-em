import mongoose, { connect, createConnection, ConnectOptions, Connection } from 'mongoose';
import getconfig from '../config';
import logger from '../logger';

class MongoBot {
  private connections: Map<string, Connection>;

  constructor() {
    this.connections = new Map();
  }
  async init(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let counter = 0;
        const { MONGO_SRV_EXEM, MONGO_DB_EXEM, } = getconfig();
        logger.info('MONGO_DB_EXEM :: URI :: --->> ', MONGO_SRV_EXEM, " MONGO_DB_EXEM :: -->>", MONGO_DB_EXEM);
      

        /* 1. EXEM mongoDB connection */
        const mongoConnectEXEM: any = createConnection(`${MONGO_SRV_EXEM}`, {
          useUnifiedTopology: true
        } as ConnectOptions);

        mongoConnectEXEM.on('connected', () => {
          logger.info('EXEM MongoDB Connected successfully.');
          counter += 1;
          this.connections.set(MONGO_DB_EXEM, mongoConnectEXEM);
          check();
        });

        mongoConnectEXEM.on('error', (err: any) => {
          logger.error('EXEM MongoDB Connection Error --->', err);
        });


       

        async function check() {
          if (counter === 1) {  // EXEM, admin, buyer, transport
            logger.info(' All MongoDB Connected successfully.');
            resolve();
          }
        }

      } catch (err) {
        logger.error(" MongoDB Error --->", err);
        process.exit(0);
      }
    })
  }

  getConnection(connectionName: string): Connection {
    return this.connections.get(connectionName) || mongoose.connection;
  }

}

export default new MongoBot();
