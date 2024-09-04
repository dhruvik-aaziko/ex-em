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
import contaceInfoModel from './contactInfo.model'
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';


const { MONGO_DB_EXEM } = getconfig();

class ContaceInfoController implements Controller {
    public path = `/${ROUTES.CONTACT_INFO}`;
    public router = Router();

    public ContaceInfo = contaceInfoModel



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

        this.router.post(`${this.path}/createContactInfo`, this.createContactInfo);
        this.router.post(`${this.path}/getContactInfo`, this.getContactInfo);
        this.router.put(`${this.path}/updateContactInfo/:id`, this.updateContactInfo);
        this.router.delete(`${this.path}/deleteContactInfo/:id`, this.deleteContactInfo);

        // Routes for notes within tasks
        this.router.put(`${this.path}/addnote/:id`, this.addNote); // Add a new note
        this.router.put(`${this.path}/updatenote`, this.updateNote); // Update a note
        this.router.delete(`${this.path}/deletenote`, this.deleteNote); // Delete a note
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
                companyName: row['companyName'] || null,
                personName: row['personName'] || null,
                Phone: row['Phone']
                    ? parseInt(String(row['Phone']).replace(/[^0-9]/g, ''), 10)
                    : null,
                Email: row['Email'] || null,
                Position: row['Position'] || null
            }));



            console.log('Mapped Documents:', documents); // Log the data to be inserted

            // Batch size for insertion
            const batchSize = 100; // Adjust as needed
            for (let i = 0; i < documents.length; i += batchSize) {
                const batch = documents.slice(i, i + batchSize);
                const result = await MongoService.insertMany(MONGO_DB_EXEM, this.ContaceInfo, { insert: batch });
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

    public createContactInfo = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const contactData = request.body;
            // const { companyName, personName ,Phone ,Email ,Position} = request.body;

            // Insert new contact info into the database
            const result = await MongoService.create(MONGO_DB_EXEM, this.ContaceInfo, {
                // insert: {
                //     companyName: companyName,
                //     personName:personName,
                //     Phone:Phone,
                //     Email:Email,
                //     Position:Position,
                // }
                insert: contactData

            });

            successMiddleware(
                {
                    message: 'Contact information created successfully',
                    data: result
                },
                request,
                response,
                next
            );
        } catch (error) {
            logger.error(`Error creating contact info: ${error}`);
            next(error);
        }
    };

    // Get contact info by name
    public getContactInfo = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { companyName } = request.body;

            const result = await MongoService.find(MONGO_DB_EXEM, this.ContaceInfo, { query: { companyName: companyName } });

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

    // Update contact info by ID
    public updateContactInfo = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { id } = request.params;
            const updateData = request.body;

            // Define options for findOneAndUpdate
            const options = {
                query: { _id: id },
                updateData: updateData,
                updateOptions: { new: true } // Return the updated document
            };

            // Perform the update operation
            const result = await MongoService.findOneAndUpdate(MONGO_DB_EXEM, this.ContaceInfo, options);

            if (!result) {
                return response.status(404).json({ message: 'Contact info not found' });
            }

            successMiddleware(
                {
                    message: 'Contact information updated successfully',
                    data: result
                },
                request,
                response,
                next
            );
        } catch (error) {
            logger.error(`Error updating contact info: ${error}`);
            next(error);
        }
    };

    // Delete contact info by ID
    public deleteContactInfo = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { id } = request.params;

            const result = await MongoService.deleteOne(MONGO_DB_EXEM, this.ContaceInfo, { query: { _id: id } });

            if (!result.deletedCount) {
                return response.status(404).json({ message: 'Contact info not found' });
            }

            successMiddleware(
                {
                    message: 'Contact information deleted successfully',
                    data: result
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

    public addNote = async (
        request: Request,
        response: Response,
        next: NextFunction
    ) => {
        try {
            const { id } = request.params;
            const { text } = request.body;

            if (!text ) {
                return response
                    .status(400)
                    .json({ message: 'Text and timestamp are required' });
            }

            const result = await MongoService.findOneAndUpdate(
                MONGO_DB_EXEM,
                this.ContaceInfo,
                {
                    query: { _id: id },
                    updateData: {
                        $push: { notes: { text } }
                    },
                    updateOptions: { new: true }
                }
            );

            if (!result) {
                return response.status(404).json({ message: 'Task not found' });
            }

            successMiddleware(
                {
                    message: 'Note added successfully',
                    data: result
                },
                request,
                response,
                next
            );
        } catch (error) {
            logger.error(`Error adding note: ${error}`);
            next(error);
        }
    };

    public updateNote = async (
        request: Request,
        response: Response,
        next: NextFunction
      ) => {
        try {
          // Extract the data from the request body
          const { newText, conatctInfoId, noteId } = request.body;
    
          // Check if all required fields are present
          if (!newText || !conatctInfoId || !noteId) {
            return response
              .status(400)
              .json({ message: 'New text, call ID, and note ID are required' });
          }
    
          // Convert callId and noteId to ObjectId
          const callObjectId = new mongoose.Types.ObjectId(conatctInfoId);
          const noteObjectId = new mongoose.Types.ObjectId(noteId);
    
          console.log(callObjectId, noteObjectId)
          // Perform the update operation
          const result = await MongoService.findOneAndUpdate(
            MONGO_DB_EXEM,
            this.ContaceInfo,
            {
              query: { _id: callObjectId, 'notes._id': noteObjectId },
              updateData: { $set: { 'notes.$.text': newText } },
              updateOptions: { new: true }
            }
          );
    
          // Check if the result is valid
          if (!result) {
            return response.status(404).json({ message: 'Contact info or note not found' });
          }
    
          // Send success response
          successMiddleware(
            {
              message: 'Note updated successfully',
              data: result
            },
            request,
            response,
            next
          );
        } catch (error) {
          // Log error and pass to the error handler middleware
          logger.error(`Error updating note: ${error}`);
          next(error);
        }
      };
    
    
      public deleteNote = async (
      request: Request,
      response: Response,
      next: NextFunction
    ) => {
      try {
        // Extract callId and noteId from request
        const { conatctInfoId, noteId } = request.body;
    
        // Validate `callId` and `noteId`
        if (!conatctInfoId || !noteId) {
          return response.status(400).json({ message: 'Call ID and note ID are required' });
        }
    
        // Convert `callId` and `noteId` to ObjectId
        const callObjectId = new mongoose.Types.ObjectId(conatctInfoId);
        const noteObjectId = new mongoose.Types.ObjectId(noteId);
    
        // Perform the update operation
        const result = await MongoService.findOneAndUpdate(
          MONGO_DB_EXEM,
          this.ContaceInfo,
          {
            query: { _id: callObjectId, 'notes._id': noteObjectId },
            updateData: { $pull: { notes: { _id: noteObjectId } } },
            updateOptions: { new: true }
          }
        );
    
        // Handle case where no document was found
        if (!result || result.matchedCount === 0) {
          return response.status(404).json({ message: 'Contact info not found or note not found' });
        }
    
        // Successful response
        successMiddleware(
          {
            message: 'Note deleted successfully',
            data: result
          },
          request,
          response,
          next
        );
      } catch (error) {
        // Log error and pass to the error handler middleware
        logger.error(`Error deleting note: ${error}`);
        next(error);
      }
    
    }
}

export default ContaceInfoController;