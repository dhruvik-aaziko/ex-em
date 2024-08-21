import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import mongodb from "./connections/mongo";
import cors from 'cors';
import { errorMiddleware } from './middleware/response.middleware';
import { getHttpServer, serverInitialize } from './connections/http';
import morganMiddleware from './middleware/morgan.middleware';
import getconfig from './config';
import { AGENDA_JOB_CONSTANT } from './constants';
import moment from 'moment';
import { agenda } from './utils/agendaScheduling';
import Controller from './interfaces/controller.interface';
import { initializesAllControllers } from './api';


/**
 * The main application class.
 * Initializes the express app, connects to the database, and sets up middleware, routes, and error handling.
 */
class App {
    public app = express.application;

    /**   
     * Initializes a new instance of the App class.
     */
    constructor() {
        this.app = express();
        Promise.all([
            this.connectToTheDatabase(),
            this.initializeMiddleware(),
            this.InitializeAllRoute(),
            this.initializeErrorHandling()
        ]).then(() => {
            this.listen();
        });
    }

    /**
     * Connects to the database and initializes other connections.
     */
    private async connectToTheDatabase() {
        try {
            await serverInitialize(this.app);
            await mongodb.init();
            
           
        } catch (error: any) {
            console.error('connectToTheDatabase :: error :--->> ', error);
            throw new Error(error);
        }
    }

    /**
     * Initializes middleware for the express app.
     */
    private async initializeMiddleware() {
        this.app.use('/export', express.static('src/download'));
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(cors());
        this.app.use(compression());
        this.app.use(morganMiddleware);
       
    }

    /**
     * Sets up all routes for the express app.
     */
    private async InitializeAllRoute() {
        this.app.get('/health', (req, res) => {
            res.status(200).send(' Health Good! ');
                
        });

        initializesAllControllers.forEach((controller: Controller) => {
            this.app.use('/api/v1', controller.router);
        });
    }

    /**
     * Initializes error handling middleware for the express app.
     */
    private async initializeErrorHandling() {
        this.app.use(errorMiddleware);
    }

    /**
     * Starts the express server and sets up agenda jobs.
     */
    private async listen() {
        const { PORT } = getconfig();
        const server = await getHttpServer();
        server.listen(PORT, () => {
            console.log(`App listening on the PORT :: --->> ${PORT}`);
        });

        /* Agenda setup */
        (async function () {
            await agenda.start();

            // Schedule job for next day for notification
            const jobName = AGENDA_JOB_CONSTANT.JOB_NAME_OBJ.NOTIFICATION;
            const jobDateStr = moment().add(1, 'days').startOf('day').toDate();

            await agenda.cancel({ name: jobName });
            await agenda.schedule(jobDateStr, jobName, {});
        })();
    }
}

try {
    new App();
} catch (error) {
    console.error('SERVER :: error :>> ', error);
}

process
    .on('unhandledRejection', (reason, p) => {
        console.log("unhandledRejection :: reason :: ", reason);
        console.log(p);
    })
    .on('uncaughtException', (err) => {
        console.log('Uncaught Exception thrown', new Date(), ' >> ', '\n', err);
    });
