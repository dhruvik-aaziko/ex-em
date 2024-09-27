import { Router, Request, Response, NextFunction, query } from 'express';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import {
    ERROR_MESSAGES,
    NUMERICAL,
    ROUTES,
    STATUS_CODE,
    SUCCESS_MESSAGES,
    EMPTY,
    COMMON_CONSTANT
} from '../../../constants';
import uploadHandler from '../../../utils/multer';
import Controller from '../../../interfaces/controller.interface';
import getconfig from '../../../config';
import { successMiddleware } from '../../../middleware/response.middleware';
import logger from '../../../logger';
import { MongoService } from '../../../utils/mongoService';
import followUpModel from '../followUp/followUp.model';
import mongoose from 'mongoose';
import { RequestWithAdmin } from '../../../interfaces/requestWithAdmin.interface';
import authMiddleware from '../../../middleware/auth.middleware';
import { validateFile } from '../../../utils/validationFunctions';
import { audioFileUploadHandle, fileUploadHandle, pdfFileUploadHandle, videoFileUploadHandle } from '../../../utils/fileUploadHandle';
import adminModel from '../../admin/admin.model';
import callModel from '../call/call.model';
import exEmModel from '../exEm.model';
import exEmTry from '../exEm2.model'
import linksModel from '../links/links.model';
import sheetModel from '../sheet/sheet.model';

const { MONGO_DB_EXEM } = getconfig();

class DropdownController {
    public path = `/${ROUTES.EX_EM}`;
    public router = Router();

    public Admin = adminModel;
    public exEm = exEmModel
    public FollowUp = followUpModel;
    public Call = callModel;
    public link = linksModel
    public exEm2 = exEmTry
    public sheet = sheetModel



    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {

        this.router.post(`${this.path}/hsCode`,authMiddleware, this.hsCode);
        this.router.post(`${this.path}/product`,authMiddleware, this.product);
        this.router.post(`${this.path}/bCountry`,authMiddleware, this.bCountry);
        this.router.post(`${this.path}/allBuyer`,authMiddleware, this.allBuyer);
    }

    private hsCode = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {

            const result = await MongoService.aggregate(
                MONGO_DB_EXEM,
                this.exEm,
                [
                    {
                        $group: {
                            _id: "$hsCode_1"
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            hscode: "$_id"
                        }
                    },
                    {
                        $sort: {
                            hscode: 1
                        }
                    }
                ]
            );


            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'hscode'),
                    data: result 
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching hscode: ${error}`);
            next(error);
        }
    };


    private product = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Perform aggregation to get unique product values
            const result = await MongoService.aggregate(
                MONGO_DB_EXEM,
                this.exEm,
                [
                    {
                        $group: {
                            _id: "$product" // Group by product
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            product: "$_id"     // Rename _id to product
                        }
                    },
                    {
                        $sort: {
                            product: 1 // Sort in ascending order (use -1 for descending)
                        }
                    }
                ]
            );



            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'product'),
                    data: result
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching product: ${error}`);
            next(error);
        }
    };


    private bCountry = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Perform aggregation to get unique product values
            const result = await MongoService.aggregate(
                MONGO_DB_EXEM,
                this.exEm,
                [
                    {
                        $group: {
                            _id: "$bCountry" // Group by product
                        }
                    },
                    {
                        $project: {
                            _id: 0,            // Exclude the _id field
                            country: "$_id"     // Rename _id to Country
                        }
                    },
                    {
                        $sort: {
                            country: 1
                        }
                    }

                ]
            );

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'Country'),
                    data: result // The projection is applied directly in the aggregation pipeline
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching Country: ${error}`);
            next(error);
        }
    };

    private allBuyer = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {

            const result = await MongoService.aggregate(
                MONGO_DB_EXEM,
                this.exEm,
                [
                    {
                        $group: {
                            _id: "$buyer"
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            comapnyName: "$_id"
                        }
                    },
                    {
                        $sort: {
                            comapnyName: 1
                        }
                    }
                ]
            );


            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'hscode'),
                    data: result // The projection is applied directly in the aggregation pipeline
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching hscode: ${error}`);
            next(error);
        }
    };



}

export default DropdownController;
