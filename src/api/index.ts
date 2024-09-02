

import exEmController from './ex_em/exEmController';
import Fullresponce from './ex_em/exEm.controller.fullResponce';
import adminController from './admin/admin.controller';
import ContaceInfoController from './ex_em/contactinfo/contactInfoController';
import linkController from './ex_em/links/linksController';
import NoteController from './ex_em/notes/noteController';

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
   new NoteController()
    
]
