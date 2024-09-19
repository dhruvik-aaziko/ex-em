

import exEmController from './ex_em/exEmController';
import Fullresponce from './ex_em/exEm.controller.fullResponce';
import adminController from './admin/admin.controller';
import ContaceInfoController from './ex_em/contactinfo/contactInfoController';
import linkController from './ex_em/links/linksController';
import NoteController from './ex_em/notes/noteController';
import taskController from './ex_em/task/taskController';
import MeetingController from './ex_em/meeting/meetingController';
import CallController from './ex_em/call/callController';
import SheetController from './ex_em/sheet/sheetController';
import FollowUpController from './ex_em/followUp/followUpController';

/**
 * Array of controller instances for the application.
 * 
 * This array includes all the controllers used in the application, both for vendor and admin purposes.
 *
 * @type {Array<Controller>}
 */
export const initializesAllControllers = [

    /* 1. Vendor Controller */
  
   new exEmController(),
   new Fullresponce(),
   new adminController(),
   new linkController(),
   new ContaceInfoController(),
   new NoteController(),
   new taskController(),
   new MeetingController(),
   new CallController(),
   new SheetController(),
   new FollowUpController()
    
]
