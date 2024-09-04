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
import meetingModel from './meeting.model';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const { MONGO_DB_EXEM } = getconfig();

class MeetingController {
  public path = `/${ROUTES.MEETING}`;
  public router = Router();
  public Meeting = meetingModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/createMeeting`, this.createMeeting); // Create a new Meeting
    this.router.post(`${this.path}/getAllMeetings`, this.getAllMeetings); // Get all Meetings
    this.router.put(`${this.path}/updateMeeting/:id`, this.updateMeeting); // Update a Meeting by ID
    this.router.delete(`${this.path}/deleteMeeting/:id`, this.deleteMeeting); // Delete a Meeting by ID

    // Routes for notes within Meetings
    this.router.put(`${this.path}/addnote/:id`, this.addNoteToMeeting); // Add a new note
    this.router.put(`${this.path}/updatenote`, this.updateNote); // Update a note
    this.router.delete(`${this.path}/deletenote`, this.deleteNote); // Delete a note
  }

  public createMeeting = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const meetingData = request.body;
      const result = await MongoService.create(MONGO_DB_EXEM, this.Meeting, {
        insert: meetingData
      });

      successMiddleware(
        {
          message: 'Meeting created successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error creating Meeting: ${error}`);
      next(error);
    }
  };

  public getAllMeetings = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
        const {companyName}=request.body
      const result = await MongoService.find(MONGO_DB_EXEM, this.Meeting, {
        query: {companyName:companyName}
      });

      successMiddleware(
        {
          message: 'Meetings fetched successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error fetching Meetings: ${error}`);
      next(error);
    }
  };

 

  public updateMeeting = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Meeting,
        {
          query: { _id: id },
          updateData: { $set: updateData },
          updateOptions: { new: true }
        }
      );

      if (!result) {
        return response.status(404).json({ message: 'Meeting not found' });
      }

      successMiddleware(
        {
          message: 'Meeting updated successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error updating Meeting: ${error}`);
      next(error);
    }
  };

  public deleteMeeting = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;
      const result = await MongoService.deleteOne(MONGO_DB_EXEM, this.Meeting, {
        query: { _id: id }
      });

      if (!result.deletedCount) {
        return response.status(404).json({ message: 'Meeting not found' });
      }

      successMiddleware(
        {
          message: 'Meeting deleted successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error deleting Meeting: ${error}`);
      next(error);
    }
  };

//       ====================================================================================================================


  public addNoteToMeeting = async (
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
        this.Meeting,
        {
          query: { _id: id },
          updateData: {
            $push: { notes: { text } }
          },
          updateOptions: { new: true }
        }
      );

      if (!result) {
        return response.status(404).json({ message: 'Meeting not found' });
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
      const { newText, meetingId, noteId } = request.body;

      // Check if all required fields are present
      if (!newText || !meetingId || !noteId) {
        return response
          .status(400)
          .json({ message: 'New text, call ID, and note ID are required' });
      }

      // Convert callId and noteId to ObjectId
      const meetingObjectId = new mongoose.Types.ObjectId(meetingId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

   
      // Perform the update operation
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Meeting,
        {
          query: { _id: meetingObjectId, 'notes._id': noteObjectId },
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
    const { meetingId, noteId } = request.body;

    // Validate `callId` and `noteId`
    if (!meetingId || !noteId) {
      return response.status(400).json({ message: 'Call ID and note ID are required' });
    }

    // Convert `callId` and `noteId` to ObjectId
    const meetingObjectId = new mongoose.Types.ObjectId(meetingId);
    const noteObjectId = new mongoose.Types.ObjectId(noteId);

    // Perform the update operation
    const result = await MongoService.findOneAndUpdate(
      MONGO_DB_EXEM,
      this.Meeting,
      {
        query: { _id: meetingObjectId, 'notes._id': noteObjectId },
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

export default MeetingController;
