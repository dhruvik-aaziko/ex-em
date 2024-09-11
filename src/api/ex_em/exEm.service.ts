import { Router, Request, Response, NextFunction } from 'express';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { EMPTY, ERROR_MESSAGES, NUMERICAL, ROUTES,   SUCCESS_MESSAGES } from "../../constants";
import uploadHandler from '../../utils/multer';
import Controller from "../../interfaces/controller.interface";
import getconfig from '../../config';
import logger from '../../logger';
import { MongoService } from '../../utils/mongoService';
import exEmModel from './exEm.model';
import { orderBy } from 'lodash';
import { TopologyType } from 'mongodb';
const { MONGO_DB_EXEM } = getconfig();

class ControllerService implements Controller {
    public path = `/${ROUTES.EX_EM}`;
    public router = Router();
    public exEm = exEmModel



    public getDataByDateRangeAndHsCode = async (request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            const { companyName, startDate, endDate, hsCode } = request.body;


            // Validate query parameters
            if (!companyName) {
                return 'Please provide companyname.'
            }


            const query: any = { buyer: companyName };

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);   


                if (start > end) {
                    return 'startDate should be less than or equal to endDate.'
                }

                query.date = {
                    $gte: start,
                    $lte: end
                };
            }

            if (hsCode) {
                query.hsCode_1 = hsCode
            }

         

            // Query the database
            const data = await MongoService.find(MONGO_DB_EXEM, this.exEm, { query });

            // Check if data was found



            return data



        } catch (error) {
            logger.error(`There was an issue into data fathimg .: ${error}`);
            next(error);
        }
    };



    public aboutUsGraph = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            // Extract query parameters from request body
            const { companyName, endDate, startDate, hsCode } = request.body;

            // Validate query parameters
            if (!companyName) {
                return 'Please provide companyname.'
            }

            // Initialize query object
            const matchQuery: any = {
                buyer: companyName
            };

            if (hsCode) {
                matchQuery.hsCode_1 = hsCode
            }
            // Conditionally add date range filter if both startDate and endDate are provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);


                if (start > end) {
                    return 'startDate should be less than or equal to endDate.'
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




            return data


        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            return next(error);
        }
    };

    public companyNexus = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName, hsCode, year, productName } = request.body;
            if (!companyName) {
                return 'Please provide companyname.'
            }
            const matchConditions: any = {
                company: companyName
            };

            // Add additional filters if they are provided
            if (hsCode) {
                matchConditions.hsCode_1 = hsCode;
            }

            
            if (year) {
                const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
                const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

                

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
                        totalValue: { $sum: "$value" },
                        TopologyType:{$:""}
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
            return data

        } catch (error) {
            logger.error(`There was an issue into data fathimg.: ${error}`);
            next(error);
        }


    }

    public mainImportProduct = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        
        try {
            const { companyName, startDate, endDate, hsCode } = request.body;

            // Validate required parameter
            if (!companyName) {
                return "Company name is required"

            }

            // Initialize the match query object
            const matchQuery: any = {
                company: companyName
            };

            if (hsCode) {
                matchQuery.hsCode_1 = hsCode
            }
            // Conditionally add date range filter if both startDate and endDate are provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);



                if (start > end) {
                    return "startDate should be less than or equal to endDate."

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
                            hsCode: "$hsCode_1"
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

            return data

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

            return formattedData;

        } catch (error) {
            logger.error(`There was an issue with data fetching: ${error}`);
            next(error);
        }
    }

    public getPortAnalysis = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName, startDate, endDate, hsCode } = request.body;

            // Validate required parameter
            if (!companyName) {
                return "Company name is required"

            }


            // Fetch the sCountry from the database based on companyName
            const companyData = await MongoService.findOne(MONGO_DB_EXEM, this.exEm, { query: { company: companyName } });

            if (!companyData) {
                return "Source country (sCountry) not found for the specified company"

            }

            const sCountry = companyData.sCountry;

            // Initialize the match query object
            const matchQuery: any = {
                company: companyName,
                sCountry: sCountry
            };

            if (hsCode) {
                matchQuery.hsCode_1 = hsCode
            }
            // Conditionally add date range filter if both startDate and endDate are provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Validate date objects


                if (start > end) {
                    return "startDate should be less than or equal to endDate."

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

            return formattedData


        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            next(error);
        }
    };



    public similarBuyer = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName, hsCode, startDate, endDate } = request.body;

            // Validate required parameter
            if (!companyName) {
                return "Company name is required"
            }

            // Initialize the match query object
            const matchQuery: any = {
                company: { $ne: companyName } // Exclude records where company is equal to companyName
            };

            // Conditionally add hsCode filter if provided
            if (hsCode) {
                matchQuery.hsCode_1 = hsCode;
            }

            // Conditionally add date range filter if both startDate and endDate are provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);


                if (start > end) {
                    return "startDate should be less than or equal to endDate."

                }

                matchQuery.date = {
                    $gte: start,
                    $lte: end
                };
            }

            // Perform the aggregation query
            const data = await MongoService.aggregate(MONGO_DB_EXEM, this.exEm, [
                {
                    $match: matchQuery
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

            return formattedData
        } catch (error) {
            logger.error(`There was an issue fetching data: ${error}`);
            next(error);
        }
    };


}

export default ControllerService;