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

const { MONGO_DB_EXEM } = getconfig();

class exEmController implements Controller {
    public path = `/${ROUTES.EX_EM}`;
    public router = Router();
    public exEm = exEmModel
    public noteContaceInfo = noteContaceInfoModel


    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {

        this.router.post(
            `${this.path}/exalUplode`,
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
        this.router.get(`${this.path}/getLast12MonthsReport`, this.getLast12MonthsReport);
        this.router.get(`${this.path}/getPortAnalysis`, this.getPortAnalysis);
        this.router.get(`${this.path}/similarBuyer`, this.similarBuyer);

        //9

        this.router.post(`${this.path}/buyerSeller`, this.buyerSeller);    
        this.router.post(`${this.path}/getUniqueBuyers`, this.getUniqueBuyers);
        //this.router.post(`${this.path}/companyData`, this.companyData);


        //note

        // this.router.post(`${this.path}/createContactNotes2`, this.createContactNotes2);
        this.router.post(`${this.path}/getCreateContactNotes`, this.getCreateContactNotes);
        this.router.post(`${this.path}/ContactNotes`, this.contactNotes);


    }

    private uploadExcelData = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const files: any = request.files; // Ensure files are correctly populated from your request

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



            if (!Array.isArray(sheetData) || sheetData.length === 0) {
                return response.status(400).json({
                    message: 'The Excel file is empty or invalid.',
                });
            }
            console.log(sheetData)
            const documents = sheetData.map((row: any) => ({

                date: typeof row.date === 'string' ? new Date(row.date.split('/').reverse().join('-')) : null,
                // date: row.date || null,
                shipmentId: row['shipment id '] ? parseInt(row['shipment id '], 10) : null,
                hsCode: row['hs code'] ? parseInt(row['hs code'], 10) : null,
                hsCode_1: row['hs code_1'] ? parseInt(row['hs code_1'], 10) : null,
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
                qty: typeof row.qty === 'string' ? parseInt(row.qty.replace(/,/g, ''), 10) : row.qty || null,
                value: typeof row.value === 'string' ? parseFloat(row.value.replace(/[$,]/g, '')) : row.value || null,
                pricePerUnit: typeof row['price/unit'] === 'string' ? parseFloat(row['price/unit'].replace(/[$,]/g, '')) : row['price/unit'] || null,
                emptyField: row['__EMPTY'] || '-',
                notes: '-',
                contactInfo: ''

            }));

            console.log('Mapped Documents:', documents); // Log the data to be inserted

            // Batch size for insertion
            const batchSize = 100; // Adjust as needed
            for (let i = 0; i < documents.length; i += batchSize) {
                const batch = documents.slice(i, i + batchSize);
                const result = await MongoService.insertMany(MONGO_DB_EXEM, this.exEm, { insert: batch });
                console.log(`Insert Result (Batch ${i / batchSize + 1}):`, result); // Log the result of the insertion
            }

            return response.status(200).json({
                message: 'Sheet data has been successfully uploaded and inserted.',
                data: documents.length
            });

        } catch (error) {
            console.error('Error in uploading Excel data:', error);
            next(error);
        }
    }




    private getDataByDateRangeAndHsCode = async (request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            const { startDate, endDate, hsCode } = request.body;
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
                response.status(STATUS_CODE.BAD_REQUEST).send({
                    message: 'Please provide companyName.'
                });
                return;
            }

            // Convert to Date objects
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Validate date range
            if (start > end) {
                response.status(STATUS_CODE.BAD_REQUEST).send({
                    message: 'startDate should be less than or equal to endDate.'
                });
                return;
            }

            // Debugging output
            console.log('Start Date:', start);
            console.log('End Date:', end);

            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: {
                        company: companyName,
                        date: {
                            $gte: start,
                            $lte: end
                        }
                    }
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
                response.status(STATUS_CODE.NOT_FOUND).send({
                    message: 'No data found for the given detail.'
                });
                return;
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
            next(error);
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
            const { companyName } = request.body;

            if (!companyName) {
                return response.status(400).json({
                    success: false,
                    message: "Company name is required"
                });
            }

            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: {
                        company: companyName
                    }
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
            logger.error(`There was an issue into data fathimg .: ${error}`);
            next(error);
        }
    }

    private getLast12MonthsReport = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            let { companyName } = request.body;
            const year = 2024
            companyName = "H&m"

            if (!companyName) {
                return response.status(400).json({
                    success: false,
                    message: "Company name is required"
                });
            }

            // Calculate the start and end dates for the last 12 months
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(endDate.getMonth() - 12);

            const startDateStr: string = startDate.toLocaleDateString('en-GB'); // Format: dd/MM/yyyy
            const endDateStr = endDate.toLocaleDateString('en-GB'); // Format: dd/MM/yyyy
            console.log(endDateStr, startDateStr);

            const a = startDateStr.toString()
            const b = endDate.toString()

            console.log(endDate, startDate);
            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: {
                        company: companyName,
                        date: {
                            $gte: a, $lte: b
                        }
                    }
                },
                {
                    $addFields: {
                        dateObj: {
                            $dateFromString: {
                                dateString: "$date",
                                format: "%d/%m/%Y"
                            }
                        },
                        month: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: {
                                    $dateFromString: {
                                        dateString: "$date",
                                        format: "%d/%m/%Y"
                                    }
                                }
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
            console.log(data);

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



            // Send the aggregated data as a response
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

    private getPortAnalysis = async (
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

            // Fetch the sCountry from the database based on companyName
            const companyData = await MongoService.findOne(MONGO_DB_EXEM, this.exEm, { query: { company: companyName } });

            if (!companyData) {
                return response.status(404).json({
                    success: false,
                    message: "Source country (sCountry) not found for the specified company"
                });
            }

            const sCountry = companyData.sCountry;

            // Aggregate the data
            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: {
                        company: companyName,
                        sCountry: sCountry
                    }
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
            logger.error(`There was an issue into data fathimg .: ${error}`);
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

    // private buyerSeller = async (
    //     request: Request,
    //     response: Response,
    //     next: NextFunction
    // ) => {
    //     try {
    //         // Extract query parameters from request body
    //         const { companyName, endDate, startDate, type } = request.body;



    //         if (!companyName) {
    //             response.send("please provide companyName ")

    //         }

    //         if (!type) {
    //             response.send("please provide type ")

    //         }

    //         const query: any = {};





    //         if (startDate && endDate) {
    //             query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    //             logger.info(endDate,startDate)
    //         }

    //         if (type === "seller") {
    //             query.seller = companyName;
    //         } else if (type === "buyer") {
    //             query.buyer = companyName;
    //         }
    //         if (type === "seller") {

    //         const data = await MongoService.find(MONGO_DB_EXEM, this.exEm, { query ,  select: 'seller sCountry  product industry  hsCode_1  unit qty value	pricePerUnit'});
    //         successMiddleware(
    //             {
    //                 message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'buyerSeller'),
    //                 data: data
    //             },
    //             request,
    //             response,
    //             next
    //         );
    //         }
    //         if (type === "buyer") {
    //             logger.info(query)
    //         const data = await MongoService.find(MONGO_DB_EXEM, this.exEm, {query ,  select: 'buyer bCountry  product industry hsCode_1  unit  qty   value	pricePerUnit'});
    //         successMiddleware(      
    //             {
    //                 message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'buyerSeller'),
    //                 data: data
    //             },
    //             request,
    //             response,
    //             next
    //         );
    //         }


    //     } catch (error) {
    //         logger.error(`There was an issue fetching data: ${error}`);
    //         next(error);
    //     }
    // };

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


    private companyData = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            const { hsCode, country, endDate, startDate } = request.body;



            if (!hsCode) {
                response.send("please provide hsCode ")

            }

            if (!country) {
                response.send("please provide coountry ")

            }

            const query: any = {};



            if (country && hsCode) {
                query.bCountry = country;
                query.hsCode_1 = hsCode;

            }

            if (startDate && endDate) {
                query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }


            const data = await MongoService.find(MONGO_DB_EXEM, this.exEm, {
                query,
                select: 'buyer product qty pricePerUnit notes contactInfo'
            });
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'buyerSeller'),
                    data: data
                },
                request,
                response,
                next
            );
        }



        catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            next(error);
        }
    };

    private contactNotes = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            //const { id } = request.params;
            const { companyName, notes, conatctInfo } = request.body;  // Destructure notes and contactInfo from request body


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
                        conatctInfo: conatctInfo

                    }

                }
            );

            // Check if the document was found and updated
            if (!updatedOrder) {
                return response.status(404).send({ message: "Order not found." });
            }

            // Send the updated order in the response
            response.send(updatedOrder);

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
            const { hsCode, startDate, endDate, country } = request.body;
    
            // Validate required parameters
            if (!hsCode || !startDate || !endDate || !country) {
                return response.status(400).send("Please provide hsCode, startDate, endDate, and country");
            }
    
            // Build the query object
            const query = {
                date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                hsCode_1: hsCode,
                bCountry: country
            };
    
            // Perform the aggregation to get unique buyers with product details
            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                { $match: query },
                {
                    $group: {
                        _id: {
                            buyer: "$buyer",
                            product: "$product",
                            pricePerUnit: "$pricePerUnit"
                        },
                        totalQty: { $sum: "$qty" }
                        
                    }
                },
                {
                    $group: {
                        _id: "$_id.buyer",
                        products: {
                            $push: {
                                product: "$_id.product",
                                qty: "$totalQty",
                                pricePerUnit: "$_id.pricePerUnit",
                               
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        buyer: "$_id",
                        details: "$products"
                    }
                }
            ]);
    
            // Respond with the unique buyers and their details
            successMiddleware(
                {
                    message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'unique buyers with product details'),
                    data: data // The projection is applied directly in the aggregation pipeline
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
    
    
    

    private createContactNotes2 = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body

            const { companyName, notes, conatctInfo } = request.body;  // Destructure notes and contactInfo from request body




            // Update the document with the provided fields
            const updatedOrder = await MongoService.create(
                MONGO_DB_EXEM,
                this.noteContaceInfo,
                {
                    insert: {
                        companyName: companyName,
                        notes: notes,
                        conatctInfo: conatctInfo

                    }

                }
            );

            // Check if the document was found and updated
            if (!updatedOrder) {
                return response.status(404).send({ message: "Order not found." });
            }

            // Send the updated order in the response
            response.send(updatedOrder);

        } catch (error) {
            // Pass the error to the next middleware (for error handling)
            next(error);
        }
    }

    private getCreateContactNotes = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body

            const { companyName } = request.body;  // Destructure notes and contactInfo from request body




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
            response.send(result);

        } catch (error) {
            // Pass the error to the next middleware (for error handling)
            next(error);
        }
    }

}



export default exEmController;