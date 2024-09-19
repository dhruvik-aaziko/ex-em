import { Router, Request, Response, NextFunction } from 'express';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { ERROR_MESSAGES, NUMERICAL, ROUTES, STATUS_CODE, SUCCESS_MESSAGES, EMPTY } from "../../constants";
import uploadHandler from '../../utils/multer';
import Controller from "../../interfaces/controller.interface";
import getconfig from '../../config';
import { successMiddleware } from '../../middleware/response.middleware';
import logger from '../../logger';
import { MongoService } from '../../utils/mongoService';
import noteContaceInfoModel from './noteContaceInfo'
import exEmModel from './exEm.model';
import exEmTry from './exEm2.model'
import authMiddleware from '../../middleware/auth.middleware';
import sheetModel from './sheet/sheet.model';
import { KinesisVideoWebRTCStorage } from 'aws-sdk';

const { MONGO_DB_EXEM } = getconfig();

class exEmController implements Controller {
    public path = `/${ROUTES.EX_EM}`;
    public router = Router();
    public exEm = exEmModel
    public noteContaceInfo = noteContaceInfoModel
    public exEm2 = exEmTry
    public sheet = sheetModel


    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {

        this.router.post(
            `${this.path}/exalUplode`,
            authMiddleware,
            uploadHandler.fields([
                { name: "file", maxCount: 1 },
            ]),
            this.uploadExcelData
        );

        this.router.get(`${this.path}/getdata`, this.getDataByDateRangeAndHsCode);
        this.router.get(`${this.path}/aboutUsGraph`, this.aboutUsGraph);
        this.router.post(`${this.path}/nexus`, this.companyNexus);
        this.router.post(`${this.path}/productNexus`, this.productNexus);
        this.router.get(`${this.path}/mainImportProduct`, this.mainImportProduct);
        this.router.post(`${this.path}/getLast12MonthsReport`, authMiddleware, this.getLast12MonthsReport);
        this.router.get(`${this.path}/getPortAnalysis`, this.getPortAnalysis);
        this.router.get(`${this.path}/similarBuyer`, this.similarBuyer);

        //9

        this.router.post(`${this.path}/buyerSeller`, authMiddleware, this.buyerSeller);
        this.router.post(`${this.path}/getUniqueBuyers`, authMiddleware, this.getUniqueBuyers);
        //this.router.post(`${this.path}/companyData`, this.companyData);


        //note

        // this.router.post(`${this.path}/createContactNotes2`, this.createContactNotes2);
        this.router.post(`${this.path}/getContactNotes`, this.getContactNotes);
        this.router.post(`${this.path}/createContactNotes`, this.createContactNotes);

        // Dropdown
        this.router.post(`${this.path}/hsCode`, this.hsCode);
        this.router.post(`${this.path}/product`, this.product);
        this.router.post(`${this.path}/bCountry`, this.bCountry);
        this.router.post(`${this.path}/try`, this.try);

        //
        this.router.post(`${this.path}/productInfo`, authMiddleware, this.productInfo);
        this.router.post(`${this.path}/sellerInfo`, this.sellerInfo);
        this.router.put(`${this.path}/updateContactInfo`, this.updateContactInfo);


    }

    private uploadExcelData = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const files: any = request.files;

            if (!files || !files.file || files.file.length === 0) {
                return response.status(400).json({
                    message: 'No file uploaded. Please upload an Excel file.',
                });
            }

            const allowedMimeTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];
            const file = files.file[0];

            if (!allowedMimeTypes.includes(file.mimetype)) {
                return response.status(415).json({
                    message: 'Invalid file type. Please upload an Excel file.',
                });
            }

            const filePath = file.path;
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            //console.log(`Uploaded file name: ${file.originalname}`);

            if (!Array.isArray(sheetData) || sheetData.length === 0) {
                return response.status(400).json({
                    message: 'The Excel file is empty or invalid.',
                });
            }

            // Prepare documents for bulk insert
            const documents = sheetData.map((row: any) => ({
                insertOne: {
                    document: {
                        date: typeof row.date === 'string' ? new Date(row.date.split('/').reverse().join('-')) : null,
                        shipmentId: row['shipment id '] ? parseInt(row['shipment id '], 10) : null,
                        hsCode: row['hs code'] ? parseInt(row['hs code'], 10) : null,
                        hsCode_1: row['hs code_1'] ? parseInt(row['hs code_1'], 10) : null,
                        qty: typeof row.qty === 'string' ? parseInt(row.qty.replace(/,/g, '')) : row.qty || 0,
                        value: typeof row.value === 'string' ? parseFloat(row.value.replace(/[$,]/g, '')) : row.value || 0,
                        pricePerUnit: typeof row['price/unit'] === 'string' ? parseFloat(row['price/unit'].replace(/[$,]/g, '')) : row['price/unit'] || 0,
                        industry: row['indutry'] || null,
                        product: row['prodcut'] || null,
                        bCountry: row['b cntry'] || null,
                        buyer: row.buyer || null,
                        dPort: row['D port'] || null,
                        sCountry: row['S cntry'] || null,
                        seller: row.seller || null,
                        sPort: row['s port'] || null,
                        portCode: row['port code'] || null,
                        unit: row.unit || null,
                        emptyField: row['__EMPTY'] || '-',
                        sheetName: file.originalname


                    }
                }
            }));

            const batchSize = 1000; // Experiment with optimal size
            const maxConcurrentBatches = 5; // Limit concurrency to avoid overwhelming MongoDB

            const insertBatches = async (batchStart: number) => {
                const batch = documents.slice(batchStart, batchStart + batchSize);

                await MongoService.bulkWrite(MONGO_DB_EXEM, this.exEm, batch);
            };

            const batchPromises = [];

            for (let i = 0; i < documents.length; i += batchSize) {
                if (batchPromises.length >= maxConcurrentBatches) {
                    await Promise.all(batchPromises); // Wait for the current batch to finish before starting more
                    batchPromises.length = 0; // Reset for new concurrent batches
                }
                batchPromises.push(insertBatches(i));
            }

            // Ensure any remaining batches are also completed
            if (batchPromises.length > 0) {
                await Promise.all(batchPromises);
            }
            await MongoService.create(MONGO_DB_EXEM, this.sheet, { insert: { sheetName: file.originalname } });
            return response.status(200).json({
                message: 'Sheet data has been successfully uploaded and inserted.',
                data: documents.length
            });

        } catch (error) {
            console.error('Error in uploading Excel data:', error);
            next(error);
        }
    };


    // private uploadExcelData = async (
    //     request: Request,
    //     response: Response,
    //     next: NextFunction
    // ) => {
    //     try {
    //         const files: any = request.files; // Ensure files are correctly populated from your request

    //         if (!files?.file?.length) {
    //             return response.status(400).json({
    //                 message: 'No file uploaded. Please upload an Excel file.',
    //             });
    //         }

    //         const allowedMimeTypes = [
    //             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    //             'application/vnd.ms-excel'
    //         ];
    //         const file = files.file[0];

    //         if (!allowedMimeTypes.includes(file.mimetype)) {
    //             return response.status(415).json({
    //                 message: 'Invalid file type. Please upload an Excel file.',
    //             });
    //         }

    //         const workbook = XLSX.readFile(file.path);
    //         const sheetName = workbook.SheetNames[0];
    //         const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    //         console.log(`Uploaded file name: ${file.originalname}`);

    //         if (!Array.isArray(sheetData) || !sheetData.length) {
    //             return response.status(400).json({
    //                 message: 'The Excel file is empty or invalid.',
    //             });
    //         }
    //         logger.info("================>>>", sheetName);

    //         const documents = sheetData.map((row: any) => ({
    //             date: typeof row.date === 'string' ? new Date(row.date.split('/').reverse().join('-')) : null,
    //             shipmentId: row['shipment id '] ? parseInt(row['shipment id '], 10) : null,
    //             hsCode: row['hs code'] ? parseInt(row['hs code'], 10) : null,
    //             hsCode_1: row['hs code_1'] ? parseInt(row['hs code_1'], 10) : null,
    //             industry: row['indutry'] || null,
    //             product: row['prodcut'] || null,
    //             bCountry: row['b cntry'] || null,
    //             buyer: row.buyer || null,
    //             dPort: row['D port'] || null,
    //             sCountry: row['S cntry'] || null,
    //             seller: row.seller || null,
    //             sPort: row['s port'] || null,
    //             portCode: row['port code'] || null,
    //             unit: row.unit || null,
    //             qty: typeof row.qty === 'string' ? parseInt(row.qty.replace(/,/g, ''), 10) : row.qty || NUMERICAL.ZERO,
    //             value: typeof row.value === 'string' ? parseFloat(row.value.replace(/[$,]/g, '')) : row.value || NUMERICAL.ZERO,
    //             pricePerUnit: typeof row['price/unit'] === 'string' ? parseFloat(row['price/unit'].replace(/[$,]/g, '')) : row['price/unit'] || NUMERICAL.ZERO,
    //             emptyField: row['__EMPTY'] || '-',
    //             sheetName:file.originalname
    //         }));

    //         // Batch size for insertion
    //         const batchSize = 100; // Adjust as needed
    //         for (let i = 0; i < documents.length; i += batchSize) {
    //             const batch = documents.slice(i, i + batchSize);
    //             await MongoService.insertMany(MONGO_DB_EXEM, this.exEm2, { insert: batch });
    //         }

    //         // Pass fileInfo wrapped in an array to match expected input for `model.create`
    //         await MongoService.create(MONGO_DB_EXEM, this.sheet, { insert: { sheetName: file.originalname } });

    //         return response.status(200).json({
    //             message: 'Sheet data has been successfully uploaded and inserted.',
    //             data: documents.length
    //         });

    //     } catch (error) {
    //         console.error('Error in uploading Excel data:', error);
    //         next(error);
    //     }
    // }




    private getDataByDateRangeAndHsCode = async (request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            const { companyName, startDate, endDate, hsCode } = request.body;
            console.log("Received parameters:", { startDate, endDate, hsCode });

            // Validate query parameters
            if (!hsCode) {
                response.status(STATUS_CODE.BAD_REQUEST).send({
                    message: 'Please provide hsCode as a parameter.'
                });
                return;
            }


            const query: any = { hsCode: hsCode };

            if (startDate && endDate) {
                query.date = { $gte: startDate, $lte: endDate };
            }

            if (companyName) {
                query.date = { buyer: companyName };
            }

            console.log("Database query:", query);

            // Query the database
            const data = await MongoService.find(MONGO_DB_EXEM, this.exEm, { query });

            // Check if data was found
            if (!data || data.length === 0) {
                response.status(STATUS_CODE.NOT_FOUND).send({
                    message: 'No data found for the given parameters.', startDate, endDate,
                });
                return;
            }

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `em_im`),
                    data: data
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue into data fathimg .: ${error}`);
            next(error);
        }
    };

    private aboutUsGraph = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            const { companyName, endDate, startDate } = request.body;

            // Validate query parameters
            if (!companyName) {
                return response.status(STATUS_CODE.BAD_REQUEST).send({
                    message: 'Please provide companyName.'
                });
            }

            // Initialize query object
            const matchQuery: any = {
                company: companyName
            };

            // Conditionally add date range filter if both startDate and endDate are provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Validate date objects
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    return response.status(STATUS_CODE.BAD_REQUEST).send({
                        message: 'Invalid date format.'
                    });
                }

                if (start > end) {
                    return response.status(STATUS_CODE.BAD_REQUEST).send({
                        message: 'startDate should be less than or equal to endDate.'
                    });
                }

                matchQuery.date = {
                    $gte: start,
                    $lte: end
                };
            }

            // Aggregation
            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: matchQuery
                },
                {
                    $group: {
                        _id: "$industry",
                        totalValue: { $sum: "$value" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        industry: "$_id",
                        totalValue: 1
                    }
                }
            ]);

            // Check if data was found
            if (!data || data.length === 0) {
                return response.status(STATUS_CODE.NOT_FOUND).send({
                    message: 'No data found for the given detail.'
                });
            }

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `aboutUsGraph`),
                    data: data
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            return next(error);
        }
    };



    private companyNexus = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName, hsCode, year, productName } = request.body;

            const matchConditions: any = {
                company: companyName
            };

            // Add additional filters if they are provided
            if (hsCode) {
                matchConditions.hsCode = hsCode;
            }

            console.log("hsCode", typeof (hsCode))
            if (year) {
                const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
                const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

                console.log(startDate.toISOString(), endDate.toISOString());

                matchConditions.date = { $gte: startDate, $lte: endDate };
            }


            if (productName) {
                matchConditions.product = productName;
            }

            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: matchConditions
                },
                {
                    $group: {
                        _id: "$seller",
                        totalValue: { $sum: "$value" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        seller: "$_id",
                        totalValue: 1
                    }
                }
            ]);

            // Send the aggregated data as a response
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `companyNexus`),
                    data: data
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue into data fathimg.: ${error}`);
            next(error);
        }


    }

    private mainImportProduct = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName, startDate, endDate } = request.body;

            // Validate required parameter
            if (!companyName) {
                return response.status(400).json({
                    success: false,
                    message: "Company name is required"
                });
            }

            // Initialize the match query object
            const matchQuery: any = {
                company: companyName
            };

            // Conditionally add date range filter if both startDate and endDate are provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Validate date objects
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    return response.status(400).json({
                        success: false,
                        message: "Invalid date format."
                    });
                }

                if (start > end) {
                    return response.status(400).json({
                        success: false,
                        message: "startDate should be less than or equal to endDate."
                    });
                }

                matchQuery.date = {
                    $gte: start,
                    $lte: end
                };
            }

            // Aggregation pipeline
            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: matchQuery
                },
                {
                    $group: {
                        _id: {
                            product: "$product",
                            hsCode: "$hsCode"
                        },
                        totalValue: { $sum: "$value" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        products: {
                            $push: {
                                product: "$_id.product",
                                hsCode: "$_id.hsCode",
                                totalValue: "$totalValue"
                            }
                        },
                        overallTotalValue: { $sum: "$totalValue" }
                    }
                },
                {
                    $unwind: "$products"
                },
                {
                    $addFields: {
                        "products.percentage": {
                            $multiply: [
                                { $divide: ["$products.totalValue", "$overallTotalValue"] },
                                100
                            ]
                        }
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: "$products"
                    }
                },
                {
                    $sort: {
                        percentage: -1 // Sort by percentage in descending order
                    }
                }
            ]);

            // Send the aggregated data as a response
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `em_im`),
                    data: data
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            next(error);
        }
    };


    public getLast12MonthsReport = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName } = request.body;

            if (!companyName) {
                return "Company Name is required";
            }

            // Calculate the start and end dates for the last 12 months
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(endDate.getMonth() - 12);

            logger.info(startDate, endDate);

            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: {
                        buyer: companyName,
                        date: {
                            $gte: startDate, $lte: endDate
                        }
                    }
                },
                {
                    $addFields: {
                        month: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: "$date"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: "$month",
                            industry: "$industry"
                        },
                        totalValue: { $sum: "$value" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.month",
                        industries: {
                            $push: {
                                industry: "$_id.industry",
                                totalValue: "$totalValue"
                            }
                        }
                    }
                },
                {
                    $sort: {
                        "_id": 1 // Sort by month in ascending order
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id",
                        industries: 1
                    }
                }
            ]);



            // Generate a list of months for comparison
            const months = Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                return date.toISOString().slice(0, 7); // Format: yyyy-MM
            }).reverse();

            // Map the data to ensure all months are represented
            const formattedData = months.reduce((acc: any, month: string) => {
                const monthData = data.find((item: any) => item.month === month) || { month, industries: [] };
                const monthName = new Date(month + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });
                acc[monthName] = monthData.industries;
                return acc;
            }, {});

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `em_im`),
                    data: formattedData
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            next(error);
        }
    };


    private getPortAnalysis = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName, startDate, endDate } = request.body;

            // Validate required parameter
            if (!companyName) {
                return response.status(400).json({
                    success: false,
                    message: "Company name is required"
                });
            }

            // Fetch the sCountry from the database based on companyName
            const companyData = await MongoService.findOne(MONGO_DB_EXEM, this.exEm, { query: { company: companyName } });

            if (!companyData) {
                return response.status(404).json({
                    success: false,
                    message: "Source country (sCountry) not found for the specified company"
                });
            }

            const sCountry = companyData.sCountry;

            // Initialize the match query object
            const matchQuery: any = {
                company: companyName,
                sCountry: sCountry
            };

            // Conditionally add date range filter if both startDate and endDate are provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Validate date objects
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    return response.status(400).json({
                        success: false,
                        message: "Invalid date format."
                    });
                }

                if (start > end) {
                    return response.status(400).json({
                        success: false,
                        message: "startDate should be less than or equal to endDate."
                    });
                }

                matchQuery.date = {
                    $gte: start,
                    $lte: end
                };
            }

            // Aggregate the data
            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: matchQuery
                },
                {
                    $group: {
                        _id: "$bCountry",
                        totalValue: { $sum: "$value" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSum: { $sum: "$totalValue" },
                        countries: {
                            $push: {
                                bCountry: "$_id",
                                value: "$totalValue"
                            }
                        }
                    }
                },
                {
                    $unwind: "$countries"
                },
                {
                    $addFields: {
                        "countries.percentage": {
                            $multiply: [
                                { $divide: ["$countries.value", "$totalSum"] },
                                100
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSum: { $first: "$totalSum" },
                        countries: { $push: "$countries" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalSum: 1,
                        countries: 1
                    }
                }
            ]);

            // Format the response
            const formattedData = {
                company: companyName,
                sCountry: sCountry,
                totalValue: data[0]?.totalSum || 0,
                bCountries: data[0]?.countries || []
            };

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `em_im`),
                    data: formattedData
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            next(error);
        }
    };


    private productNexus = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { company, hsCodeLength } = request.body;

            if (!company || !hsCodeLength) {
                return response.status(400).json({
                    success: false,
                    message: "Company and hsCodeLength are required"
                });
            }

            // Ensure hsCodeLength is within acceptable bounds
            if (![2, 4, 6, 8].includes(hsCodeLength)) {
                return response.status(400).json({
                    success: false,
                    message: "hsCodeLength must be one of the following values: 2, 4, 6, 8"
                });
            }

            // Perform the aggregation query
            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: {
                        company: company
                    }
                },
                {
                    $addFields: {
                        hsCodeStr: { $toString: "$hsCode" }, // Convert hsCode to string
                        hsCodePrefix: {
                            $substr: [{ $toString: "$hsCode" }, 0, hsCodeLength] // Extract prefix based on length
                        },
                        hsCodeLengthCheck: { $strLenCP: { $toString: "$hsCode" } } // Length of hsCode
                    }
                },
                {
                    $match: {
                        hsCodeLengthCheck: { $eq: hsCodeLength } // Ensure length matches hsCodeLength
                    }
                },
                {
                    $group: {
                        _id: "$hsCodePrefix",
                        sellers: { $addToSet: "$seller" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        hsCode: "$_id",
                        sellers: 1
                    }
                }
            ]);

            // Format the response
            const formattedData = data.reduce((acc: any, item: any) => {
                acc[item.hsCode] = item.sellers.join(',');
                return acc;
            }, {});

            // Send the response
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `em_im`),
                    data: formattedData
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue into data fathimg .: ${error}`);
            next(error);
        }
    }

    private similarBuyer = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName } = request.body;

            if (!companyName) {
                return response.status(400).json({
                    success: false,
                    message: "Company name is required"
                });
            }

            // Perform the aggregation query
            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: {
                        company: { $ne: companyName } // Exclude records where company is equal to companyName
                    }
                },
                {
                    $group: {
                        _id: {
                            company: "$company",
                            bCountry: "$bCountry"
                        },
                        totalValue: { $sum: "$value" }, // Sum of values for the same company
                        shipmentCount: { $sum: 1 }, // Count total records
                        volume: { $sum: "$qty" } // Sum of qty for the same company
                    }
                },
                {
                    $project: {
                        _id: 0,
                        company: "$_id.company",
                        bCountry: "$_id.bCountry",
                        totalValue: 1,
                        shipmentCount: 1,
                        volume: 1 // Include volume in the output
                    }
                }
            ]);

            // Format the response
            const formattedData = data.map((item: any) => ({
                company: item.company,
                bCountry: item.bCountry,
                totalValue: item.totalValue,
                shipmentCount: item.shipmentCount,
                volume: item.volume
            }));

            // Send the response
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `em_im`),
                    data: formattedData
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue into data fathimg .: ${error}`);
            next(error);
        }
    }

    private buyerSeller = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            const { companyName, endDate, startDate, type } = request.body;

            // Validate required parameters
            if (!companyName) {
                return response.status(400).send("Please provide companyName");
            }

            if (!type) {
                return response.status(400).send("Please provide type");
            }

            if (type !== "seller" && type !== "buyer") {
                return response.status(400).send("Please provide type as either 'seller' or 'buyer'");
            }


            const query: any = {};

            // Add date range filter if both startDate and endDate are provided
            if (startDate && endDate) {
                query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
                logger.info(`Querying with date range: ${startDate} to ${endDate}`);
            }

            // Add type-specific filter
            if (type === "seller") {
                query.seller = companyName;
            } else if (type === "buyer") {
                query.buyer = companyName;
            }

            // Define fields to select based on type
            let selectFields = '';
            if (type === "seller") {
                selectFields = 'seller sCountry product industry hsCode_1 unit qty value pricePerUnit';
            } else if (type === "buyer") {
                selectFields = 'buyer bCountry product industry hsCode_1 unit qty value pricePerUnit';
            }

            // Execute the query
            const data = await MongoService.find(MONGO_DB_EXEM, this.exEm, { query, select: selectFields });

            // Respond with the data
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'buyerSeller'),
                    data: data
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            next(error);
        }
    };


    private productInfo = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            const { companyName } = request.body;

            if (!companyName) {
                return response.status(400).send("Please provide companyName");
            }

            // MongoDB aggregation pipeline
            const pipeline = [
                {
                    $match: { buyer: companyName } // Filter by companyName
                },
                {
                    $group: {
                        _id: {
                            product: "$product",
                            pricePerUnit: "$pricePerUnit"
                        },
                        totalQty: { $sum: "$qty" },
                        totalValue: { $sum: "$value" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        product: "$_id.product",
                        pricePerUnit: "$_id.pricePerUnit",
                        qty: "$totalQty",
                        value: "$totalValue"
                    }
                }
            ];

            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, pipeline);

            if (data.length === 0) {
                return response.status(404).send("No data found for the provided companyName");
            }

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'productInfo'),
                    data: data
                },
                request,
                response,
                next
            );
        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            next(error);
        }
    };


    private sellerInfo = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            const { companyName } = request.body;

            if (!companyName) {
                return response.status(400).send("Please provide companyName");
            }

            // MongoDB aggregation pipeline
            const pipeline = [
                {
                    $match: { buyer: companyName } // Filter by companyName
                },
                {
                    $group: {
                        _id: {
                            product: "$product",
                            pricePerUnit: "$pricePerUnit",
                            dPort: "$dPort",
                            seller: "$seller",
                            sPort: "$sPort",
                            unit: "$unit"
                        },
                        totalQty: { $sum: "$qty" },
                        totalValue: { $sum: "$value" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        product: "$_id.product",
                        pricePerUnit: "$_id.pricePerUnit",
                        dPort: "$_id.dPort",
                        seller: "$_id.seller",
                        sPort: "$_id.sPort",
                        unit: "$_id.unit",
                        qty: "$totalQty",
                        value: "$totalValue"
                    }
                }
            ];

            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, pipeline);

            if (data.length === 0) {
                return response.status(404).send("No data found for the provided companyName");
            }

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'productInfo'),
                    data: data
                },
                request,
                response,
                next
            );
        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            next(error);
        }
    };


    private createContactNotes = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            //const { id } = request.params;
            const { companyName, notes, conatctInfo, link } = request.body;  // Destructure notes and contactInfo from request body


            //if record found so delete it another move one 
            const destroyer = await MongoService.deleteOne(
                MONGO_DB_EXEM,
                this.noteContaceInfo,
                { query: { companyName: companyName } })



            // Update the document with the provided fields
            const updatedOrder = await MongoService.create(
                MONGO_DB_EXEM,
                this.noteContaceInfo,
                {
                    insert: {
                        companyName: companyName,
                        notes: notes,
                        conatctInfo: conatctInfo,
                        link: link

                    }

                }
            );

            // Check if the document was found and updated
            if (!updatedOrder) {
                return response.status(404).send({ message: "Order not found." });
            }

            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'company Info'),
                    data: updatedOrder
                },
                request,
                response,
                next
            );

        } catch (error) {
            // Pass the error to the next middleware (for error handling)
            next(error);
        }
    }

    private getUniqueBuyers = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { hsCode, startDate, endDate, country, product, } = request.body;
            const page = parseInt(request.query.page as string) || 1;
            const pageSize = parseInt(request.query.pageSize as string) || 10;

            // Build the query object
            const query: any = {};
            if (country) {
                query.bCountry = country;
            }
            if (hsCode) {
                query.hsCode_1 = hsCode;
            }
            if (startDate && endDate) {
                query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }
            if (product) {
                // Use regex for case-insensitive search
                query.product = { $regex: product, $options: "i" };
            }

            if (Object.keys(query).length === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'At least one filter field is required (country, hsCode, startDate, endDate, product).'
                });
            }


            // Define pagination parameters
            const paginate = {
                query: [
                    { $match: query },
                    {
                        $group: {
                            _id: {
                                bCountry: "$bCountry",
                                hsCode_1: "$hsCode_1",
                                industry: "$industry",
                                buyer: "$buyer",

                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            bCountry: "$_id.bCountry",
                            hsCode_1: "$_id.hsCode_1",

                            industry: "$_id.industry",
                            buyer: "$_id.buyer",

                        }
                    },
                    {
                        $sort: {
                            buyer: 1 
                        }
                    }
                ],
                offset: page,
                limit: pageSize
            };

            // Paginate results
            const result = await MongoService.aggregatePaginate(MONGO_DB_EXEM, this.exEm, paginate);

            // Send response
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'unique buyers with product details'),
                    data: {
                        data: result.docs,
                        currentPage: result.page,
                        pageSize: result.limit,
                        totalCount: result.totalDocs, // Total documents
                        totalPages: result.totalPages // Total pages
                    }
                },
                request,
                response,
                next
            );

        } catch (error) {
            logger.error(`There was an issue fetching unique buyers: ${error}`);
            next(error);
        }
    };



    



    private getContactNotes = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body

            const { companyName } = request.body;  // Destructure notes and contactInfo from request body


            const companyData = await MongoService.findOne(MONGO_DB_EXEM,                      // connectionName
                this.exEm, { query: { buyer: companyName }, select: 'buyer bCountry industry' })

            // Update the document with the provided fields
            const result = await MongoService.findOne(
                MONGO_DB_EXEM,
                this.noteContaceInfo,
                {
                    query: { companyName: companyName }

                }
            );

            // Check if the document was found and updated


            // Send the updated order in the response
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'hscode'),
                    data: { companyData: companyData, result: result } // The projection is applied directly in the aggregation pipeline
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


    private hsCode = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Perform aggregation to get unique hsCode_1 values and format the result
            const result = await MongoService.aggregate(
                MONGO_DB_EXEM, // Ensure this is defined and correct
                this.exEm,     // Ensure this is defined and correct
                [
                    {
                        $group: {
                            _id: "$hsCode_1" // Group by hsCode_1
                        }
                    },
                    {
                        $project: {
                            _id: 0,            // Exclude the _id field
                            hscode: "$_id"     // Rename _id to hscode
                        }
                    },
                    {
                        $sort: {
                            hscode: 1 // Sort in ascending order (use -1 for descending)
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
                            country: 1 // Sort in ascending order (use -1 for descending)
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

    private updateContactInfo = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName, newContactInfo } = request.body;

            // Validate the required fields
            if (!companyName || !Array.isArray(newContactInfo)) {
                return response.status(400).json({ message: 'companyName and newContactInfo are required and newContactInfo must be an array' });
            }



            // Perform the update operation
            const result = await MongoService.updateMany(
                MONGO_DB_EXEM,                      // connectionName
                this.noteContaceInfo,               // collections
                {
                    query: { companyName: companyName },  // query within options
                    updateData: { $set: { conatctInfo: newContactInfo } }, // updateData within options
                    updateOptions: { new: true }          // optional updateOptions
                }
            );




            // Check if the operation was successful
            if (result.matchedCount === 0) {
                return response.status(404).send({ message: 'Document not found.' });
            }

            // Send success response
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.UPDATE_SUCCESS.replace(':attribute', 'contact info'),
                    data: result
                },
                request,
                response,
                next
            );

        } catch (error) {
            // Log error and pass it to the next middleware
            logger.error(`Error in updateContactInfo: ${error}`);
            next(error);
        }
    };


    private try = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Perform aggregation to get unique product values
            const result = await MongoService.find(
                MONGO_DB_EXEM,
                this.exEm,
                {}
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

}



export default exEmController;