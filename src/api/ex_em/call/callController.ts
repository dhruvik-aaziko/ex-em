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
  EMPTY
} from '../../../constants';
import uploadHandler from '../../../utils/multer';
import Controller from '../../../interfaces/controller.interface';
import getconfig from '../../../config';
import { successMiddleware } from '../../../middleware/response.middleware';
import logger from '../../../logger';
import { MongoService } from '../../../utils/mongoService';
import CallModel from './call.model';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const { MONGO_DB_EXEM } = getconfig();

class CallController {
  public path = `/${ROUTES.CALL}`;
  public router = Router();
  public Call = CallModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/createCall`, this.createCall); // Create a new Call
    this.router.post(`${this.path}/getAllCalls`, this.getAllCalls); // Get all Calls
    this.router.put(`${this.path}/updateCall/:id`, this.updateCall); // Update a Call by ID
    this.router.delete(`${this.path}/deleteCall/:id`, this.deleteCall); // Delete a Call by ID

    // Routes for notes within Calls
    this.router.put(`${this.path}/addnote/:id`, this.addNoteToCall); // Add a new note
    this.router.put(`${this.path}/updatenote`, this.updateNoteInCall); // Update a note
    this.router.delete(`${this.path}/deletenote`, this.deleteNoteFromCall); // Delete a note
  }

  public createCall = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const CallData = request.body;
      const result = await MongoService.create(MONGO_DB_EXEM, this.Call, {
        insert: CallData
      });

      successMiddleware(
        {
          message: 'Call created successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error creating Call: ${error}`);
      next(error);
    }
  };

  public getAllCalls = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { companyName } = request.body
      const result = await MongoService.find(MONGO_DB_EXEM, this.Call, {
        query: { companyName: companyName }
      });

      successMiddleware(
        {
          message: 'Calls fetched successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error fetching Calls: ${error}`);
      next(error);
    }
  };

  public updateCall = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Call,
        {
          query: { _id: id },
          updateData: { $set: updateData },
          updateOptions: { new: true }
        }
      );

      if (!result) {
        return response.status(404).json({ message: 'Call not found' });
      }

      successMiddleware(
        {
          message: 'Call updated successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error updating Call: ${error}`);
      next(error);
    }
  };

  public deleteCall = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;
      const result = await MongoService.deleteOne(MONGO_DB_EXEM, this.Call, {
        query: { _id: id }
      });

      if (!result.deletedCount) {
        return response.status(404).json({ message: 'Call not found' });
      }

      successMiddleware(
        {
          message: 'Call deleted successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error deleting Call: ${error}`);
      next(error);
    }
  };

  //=====================================================================================================================+++++++++++++--------**********-----------------


  public addNoteToCall = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;
      const { text } = request.body;

      if (!text) {
        return response
          .status(400)
          .json({ message: 'Text and timestamp are required' });
      }

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Call,
        {
          query: { _id: id },
          updateData: {
            $push: { notes: { text } }
          },
          updateOptions: { new: true }
        }
      );

      if (!result) {
        return response.status(404).json({ message: 'Call not found' });
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

  public updateNoteInCall = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      // Extract the data from the request body
      const { newText, callId, noteId } = request.body;

      // Check if all required fields are present
      if (!newText || !callId || !noteId) {
        return response
          .status(400)
          .json({ message: 'New text, call ID, and note ID are required' });
      }

      // Convert callId and noteId to ObjectId
      const callObjectId = new mongoose.Types.ObjectId(callId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      console.log(callObjectId, noteObjectId)
      // Perform the update operation
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Call,
        {
          query: { _id: callObjectId, 'notes._id': noteObjectId },
          updateData: { $set: { 'notes.$.text': newText } },
          updateOptions: { new: true }
        }
      );

      // Check if the result is valid
      if (!result) {
        return response.status(404).json({ message: 'Call or note not found' });
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


  public deleteNoteFromCall = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    // Extract callId and noteId from request
    const { callId, noteId } = request.body;

    // Validate `callId` and `noteId`
    if (!callId || !noteId) {
      return response.status(400).json({ message: 'Call ID and note ID are required' });
    }

    // Convert `callId` and `noteId` to ObjectId
    const callObjectId = new mongoose.Types.ObjectId(callId);
    const noteObjectId = new mongoose.Types.ObjectId(noteId);

    // Perform the update operation
    const result = await MongoService.findOneAndUpdate(
      MONGO_DB_EXEM,
      this.Call,
      {
        query: { _id: callObjectId, 'notes._id': noteObjectId },
        updateData: { $pull: { notes: { _id: noteObjectId } } },
        updateOptions: { new: true }
      }
    );

    // Handle case where no document was found
    if (!result || result.matchedCount === 0) {
      return response.status(404).json({ message: 'Call not found or note not found' });
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

export default CallController;
