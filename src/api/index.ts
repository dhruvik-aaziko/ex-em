

import exEmController from './ex_em/exEmController';
import Fullresponce from './ex_em/exEm.controller.fullResponce';
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
   new Fullresponce()
    
]
