import Agenda, { Job, JobAttributesData } from 'agenda'
import logger from '../logger';
import { AGENDA_JOB_CONSTANT } from '../constants';

const mongoConnectionString = process.env.MONGO_SRV_EXEM || '';

const agenda = new Agenda({ db: { address: mongoConnectionString } });
agenda
  .on('ready', () => logger.info(` Agenda job sheduling started.`))
  .on('error', () => logger.info(" Agenda connection error! "));

const JOB_NAME_OBJ = AGENDA_JOB_CONSTANT.JOB_NAME_OBJ;

const jobNames = {
  notification: JOB_NAME_OBJ.NOTIFICATION,
};

agenda.define<JobAttributesData>(jobNames.notification, async (job: Job<JobAttributesData>) => {

  // const LeaderboardBonusObj = new LeaderboardBonusConfigController();
  // const { gameId } = job.attrs.data;
  // await LeaderboardBonusObj.creditMonthlyLeaderboardBonusConfig(gameId);
  
});


export {
  agenda
}