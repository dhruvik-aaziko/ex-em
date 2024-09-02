import { Router, Request, Response, NextFunction } from 'express';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { ERROR_MESSAGES, NUMERICAL, ROUTES, STATUS_CODE, SUCCESS_MESSAGES } from "../../constants";
import uploadHandler from '../../utils/multer';
import Controller from "../../interfaces/controller.interface";
import getconfig from '../../config';
import { successMiddleware } from '../../middleware/response.middleware';
import logger from '../../logger';
import { MongoService } from '../../utils/mongoService';
import exEmModel from './exEm.model';
import ControllerService from './exEm.service';
const { MONGO_DB_EXEM } = getconfig();


class Fullresponce implements Controller {
    public path = `/${ROUTES.EX_EM_FULLRESPONCE}`;
    public router = Router();
    private exEmService = new ControllerService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}`,

            this.getFullResponce
        );
    }

    private getFullResponce = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const [aboutUsGraph, companyNexus, getDataByDateRangeAndHsCode, getLast12MonthsReport, getPortAnalysis, mainImportProduct, similarBuyer] = await Promise.all([
                this.exEmService.aboutUsGraph(req, res, next),
                this.exEmService.companyNexus(req, res, next),
                this.exEmService.getDataByDateRangeAndHsCode(req, res, next),
                this.exEmService.getLast12MonthsReport(req, res, next),
                this.exEmService.getPortAnalysis(req, res, next),
                this.exEmService.mainImportProduct(req, res, next),
               
                this.exEmService.similarBuyer(req, res, next),

            ]);

            return successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'Dashboard'),
                    data: {
                        aboutUsGraph, companyNexus, getDataByDateRangeAndHsCode, getLast12MonthsReport, getPortAnalysis, mainImportProduct, similarBuyer
                    }
                },
                req,
                res,
                next
            );
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            next(error);
        }
    };
}


export default Fullresponce;