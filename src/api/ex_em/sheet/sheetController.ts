import { Router, Request, Response, NextFunction, query } from 'express';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { ERROR_MESSAGES, NUMERICAL, ROUTES, STATUS_CODE, SUCCESS_MESSAGES, EMPTY } from "../../../constants";
import uploadHandler from '../../../utils/multer';
import Controller from "../../../interfaces/controller.interface";
import getconfig from '../../../config';
import { successMiddleware } from '../../../middleware/response.middleware';
import logger from '../../../logger';
import { MongoService } from '../../../utils/mongoService';
import sheetModel from './sheet.model'
import exEmModel from '../exEm.model';
import authMiddleware from '../../../middleware/auth.middleware';


const { MONGO_DB_EXEM } = getconfig();

class SheetController implements Controller {
    public path = `/${ROUTES.SHEET}`;
    public router = Router();
   
    public sheet = sheetModel
    public exEm =exEmModel
   


    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {

      
        this.router.post(`${this.path}/getsheet`,authMiddleware, this.getsheet);
        this.router.post(`${this.path}/getSheetData`,authMiddleware, this.getSheetData);
        this.router.delete(`${this.path}/deletesheet`,authMiddleware, this.deletesheet);
      }
 

   
    public getsheet = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            

            const result = await MongoService.find(MONGO_DB_EXEM, this.sheet, {  });

            if (!result) {
                return response.status(404).json({ message: 'Contact info not found' });
            }

            successMiddleware(
                {
                    message: 'Contact information fetched successfully',
                    data: result
                },
                request,
                response,
                next
            );
        } catch (error) {
            logger.error(`Error fetching contact info: ${error}`);
            next(error);
        }
    };

    public getSheetData = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            
            const { sheetName } = request.body;
            const result = await MongoService.find(MONGO_DB_EXEM, this.exEm, { query:{sheetName:sheetName} });

            if (!result) {
                return response.status(404).json({ message: 'sheet data info not found' });
            }

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `sheet`),
                    data: result
                },
                request,
                response,
                next
            );
        } catch (error) {
            logger.error(`Error fetching contact info: ${error}`);
            next(error);
        }
    };



    // Delete contact info by ID
    public deletesheet = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { sheetName } = request.body;

            const result = await MongoService.deleteOne(MONGO_DB_EXEM, this.sheet, {query: { sheetName: sheetName }});
            const data = await MongoService.deleteMany(MONGO_DB_EXEM, this.exEm, {query: { sheetName: sheetName }});

            if (!result.deletedCount) {
                return response.status(404).json({ message: 'Contact info not found' });
            }

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.DELETE_SUCCESS.replace(':attribute', `sheet `),
                    data: data
                },
                request,
                response,
                next
            );
        } catch (error) {
            logger.error(`Error deleting contact info: ${error}`);
            next(error);
        }
    };
}

export default SheetController;