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
import meetingModel from './meeting.model';
import mongoose from 'mongoose';
import authMiddleware from '../../../middleware/auth.middleware';
import { RequestWithAdmin } from '../../../interfaces/requestWithAdmin.interface';
import adminModel from '../../admin/admin.model';
import contaceInfoModel from '../contactinfo/contactInfo.model'
import { validateFile } from '../../../utils/validationFunctions';
import { audioFileUploadHandle, fileUploadHandle, pdfFileUploadHandle, videoFileUploadHandle } from '../../../utils/fileUploadHandle';

const { MONGO_DB_EXEM } = getconfig();

class MeetingController {
  public path = `/${ROUTES.MEETING}`;
  public router = Router();
  public Meeting = meetingModel;
  public Admin = adminModel;
  public ContaceInfo = contaceInfoModel

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/createMeeting`, authMiddleware,
      uploadHandler.fields([

        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
        { name: "document", maxCount: 1 }

      ]), this.createMeeting); // Create a new Meeting

    this.router.post(`${this.path}/getAllMeetings`, authMiddleware, this.getAllMeetings); // Get all Meetings
    this.router.put(`${this.path}/updateMeeting/:id`, authMiddleware, this.updateMeeting); // Update a Meeting by ID
    this.router.delete(`${this.path}/deleteMeeting/:id`, authMiddleware, this.deleteMeeting); // Delete a Meeting by ID

    // Routes for notes within Meetings
    this.router.post(`${this.path}/addnote/:id`, uploadHandler.fields([

      { name: "image", maxCount: 1 },
      { name: "video", maxCount: 1 },
      { name: "audio", maxCount: 1 },
      { name: "document", maxCount: 1 }

    ]),
      authMiddleware, this.addNoteToMeeting); // Add a new note
    this.router.post(`${this.path}/updatenote`, uploadHandler.fields([

      { name: "image", maxCount: 1 },
      { name: "video", maxCount: 1 },
      { name: "audio", maxCount: 1 },
      { name: "document", maxCount: 1 }

    ]),
      authMiddleware, this.updateNote); // Update a note

    this.router.delete(`${this.path}/deletenote`, authMiddleware, this.deleteNote); // Delete a note


    this.router.post(`${this.path}/personName`, authMiddleware, this.personName);
    this.router.post(`${this.path}/phone`, authMiddleware, this.phone);
    this.router.post(`${this.path}/email`, authMiddleware, this.email);
    this.router.post(`${this.path}/phoneEmail`, authMiddleware, this.phoneEmail);


    this.router.post(
      `${this.path}/meetingOpenActivity`,
      authMiddleware,

      this.meetingOpenActivity);

    this.router.post(
      `${this.path}/meetingCompleteActivity`,
      authMiddleware,

      this.meetingCompleteActivity);


  }

  public createMeeting = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { title, companyName, countryName, industry, personName, phoneNo, emailID, notStarted, position, dateTime, host, location, participants, status, text, RescheduleAt } = request.body;
      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      const files: any = request?.files;
      console.log(files);



      const fileImageTasks = [{ type: 'image', fileArray: ['image'] }];
      const fileVideoTasks = [{ type: 'video', fileArray: ['video'] }];
      const fileAudioTasks = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentTasks = [{ type: 'document', fileArray: ['document'] }];

      for (let j = 0; j < files?.image?.length; j++) {
        const file = files?.image[j];
        await validateFile(/*res,*/  file, 'image', COMMON_CONSTANT.IMAGE_EXT_ARRAY, /*maxSizeCompany*/);

      }
      for (let j = 0; j < files?.video?.length; j++) {
        const file = files?.video[j];
        await validateFile(/*res,*/  file, 'video', COMMON_CONSTANT.VIDEO_EXT_ARRAY, /*maxSizeCompany*/);
      }
      for (let j = 0; j < files?.audio?.length; j++) {
        const file = files?.audio[j];
        await validateFile(/*res,*/  file, 'audio', COMMON_CONSTANT.AUDIO_EXT_ARRAY, /*maxSizeCompany*/);
      }
      for (let j = 0; j < files?.document?.length; j++) {
        const file = files?.document[j];
        await validateFile(/*res,*/  file, 'document', COMMON_CONSTANT.DOCUMENT_EXT_ARRAY, /*maxSizeCompany*/);
      }

      const { imagePictures } = await fileUploadHandle(files, fileImageTasks, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideoTasks, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudioTasks, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentTasks, false);
      const result = await MongoService.create(MONGO_DB_EXEM, this.Meeting, {
        insert: {
          userAdminId: currentUserId, title: title, companyName: companyName, countryName: countryName, industry: industry, personName: personName, phoneNo: phoneNo, emailID: emailID, notStarted: notStarted, position: position, dateTime: dateTime, host: host, location: location, participants: participants, status: status,
          notes: {
            text: text,
            photo: imagePictures,
            video: videoData,
            audio: audioData,
            documents: documentData,
            RescheduleAt: RescheduleAt

          },
        }
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
      const { companyName } = request.body
      const result = await MongoService.find(MONGO_DB_EXEM, this.Meeting, {
        query: { companyName: companyName }
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
      
      const { text ,RescheduleAt} = request.body;

     const files: any = request?.files;

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      let task = await MongoService.findOne(MONGO_DB_EXEM, this.Meeting, {
        query: {
          _id: request.params.id,
          userAdminId: currentUserId
        }
      })
      if (!task) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'task'));
      }

      const fileImageTasks = [{ type: 'image', fileArray: ['image'] }];
      const fileVideoTasks = [{ type: 'video', fileArray: ['video'] }];
      const fileAudioTasks = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentTasks = [{ type: 'document', fileArray: ['document'] }];

      for (let j = 0; j < files?.image?.length; j++) {
        const file = files?.image[j];
        await validateFile(/*res,*/  file, 'image', COMMON_CONSTANT.IMAGE_EXT_ARRAY, /*maxSizeCompany*/);

      }
      for (let j = 0; j < files?.video?.length; j++) {
        const file = files?.video[j];
        await validateFile(/*res,*/  file, 'video', COMMON_CONSTANT.VIDEO_EXT_ARRAY, /*maxSizeCompany*/);
      }
      for (let j = 0; j < files?.audio?.length; j++) {
        const file = files?.audio[j];
        await validateFile(/*res,*/  file, 'audio', COMMON_CONSTANT.AUDIO_EXT_ARRAY, /*maxSizeCompany*/);
      }
      for (let j = 0; j < files?.document?.length; j++) {
        const file = files?.document[j];
        await validateFile(/*res,*/  file, 'document', COMMON_CONSTANT.DOCUMENT_EXT_ARRAY, /*maxSizeCompany*/);
      }

      const { imagePictures } = await fileUploadHandle(files, fileImageTasks, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideoTasks, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudioTasks, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentTasks, false);

      logger.info("============imagePictures", imagePictures)
      logger.info("============videoData", videoData)
      logger.info("============documentData", documentData)
      logger.info("============audioData", audioData)

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Meeting,
        {
          query: { _id: request.params.id },
          updateData: {
            $push: {
              notes: {

                text:text,
                RescheduleAt:RescheduleAt,
                photo: imagePictures,
                video: videoData,
                audio: audioData,
                documents: documentData

              },

            }
          },
          updateOptions: { new: true }
        }
      );

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
      const { text,RescheduleAt, meetingId, noteId } = request.body;
    
      const meetingObjectId = new mongoose.Types.ObjectId(meetingId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      const files: any = request?.files;


     
      // Validate the existence of the task
      let task = await MongoService.findOne(MONGO_DB_EXEM, this.Meeting, {
        query: { _id: meetingObjectId }
      });
      if (!task) {
        return response.status(404).json({ message: ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'task') });
      }

      // Validate and handle files
      const fileImageTasks = [{ type: 'image', fileArray: ['image'] }];
      const fileVideoTasks = [{ type: 'video', fileArray: ['video'] }];
      const fileAudioTasks = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentTasks = [{ type: 'document', fileArray: ['document'] }];

      for (const file of files?.image || []) {
        await validateFile(file, 'image', COMMON_CONSTANT.IMAGE_EXT_ARRAY);
      }
      for (const file of files?.video || []) {
        await validateFile(file, 'video', COMMON_CONSTANT.VIDEO_EXT_ARRAY);
      }
      for (const file of files?.audio || []) {
        await validateFile(file, 'audio', COMMON_CONSTANT.AUDIO_EXT_ARRAY);
      }
      for (const file of files?.document || []) {
        await validateFile(file, 'document', COMMON_CONSTANT.DOCUMENT_EXT_ARRAY);
      }

      // Handle file uploads
      const { imagePictures } = await fileUploadHandle(files, fileImageTasks, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideoTasks, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudioTasks, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentTasks, false);


      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Meeting,
        {
          query: {
            _id: meetingObjectId,
            'notes._id': noteObjectId
          },
          updateData: {
            $set: {
              'notes.$.text': text,
              'notes.$.RescheduleAt': RescheduleAt,
              'notes.$.photo': imagePictures,
              'notes.$.video': videoData,
              'notes.$.audio': audioData,
              'notes.$.documents': documentData
            }
          },
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


  //========================================== =================== 

  public meetingCompleteActivity = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { companyName } = request.body;
      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      // Fetch the role of the current user
      const adminResults = await MongoService.find(MONGO_DB_EXEM, this.Admin, {
        query: { _id: currentUserId },
        select: 'role'
      });



      const adminResult = adminResults[0];


      let queryCondition: any = { companyName: companyName, status: "complete" };

      if (adminResult.role !== 'superAdmin') {
        queryCondition.userAdminId = currentUserId;
      }

      const result = await MongoService.find(MONGO_DB_EXEM, this.Meeting, {
        query: queryCondition,
        // Fetch the tasks based on the determined query condition
        select: 'subject dueDate taskOwner assign status'
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `Task`),
          data: result
        },
        request,
        response,
        next

      );
    } catch (error) {
      logger.error(`Error fetching tasks: ${error}`);
      next(error);
    }
  };



  public meetingOpenActivity = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { companyName } = request.body;
      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      // Fetch the role of the current user
      const adminResults = await MongoService.find(MONGO_DB_EXEM, this.Admin, {
        query: { _id: currentUserId },
        select: 'role'
      });



      const adminResult = adminResults[0];


      let queryCondition: any = { companyName: companyName, status: { $ne: "complete" } };

      if (adminResult.role !== 'superAdmin') {
        queryCondition.userAdminId = currentUserId;
      }

      // Fetch the tasks based on the determined query condition
      const result = await MongoService.find(MONGO_DB_EXEM, this.Meeting, {
        query: queryCondition

      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `Task`),
          data: result
        },
        request,
        response,
        next
      );

    } catch (error) {
      logger.error(`Error fetching tasks: ${error}`);
      next(error);
    }
  };


  public personName = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      const { companyName } = request.body;
      const result = await MongoService.find(MONGO_DB_EXEM, this.ContaceInfo, {
        query: { companyName: companyName }, select: 'personName'
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `personName`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error fetching tasks: ${error}`);
      next(error);
    }
  };
  public phone = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      const { companyName } = request.body;
      const result = await MongoService.find(MONGO_DB_EXEM, this.ContaceInfo, {
        query: { companyName: companyName }, select: 'phone'
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `phone`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error fetching tasks: ${error}`);
      next(error);
    }
  };
  public email = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      const { companyName } = request.body;
      const result = await MongoService.find(MONGO_DB_EXEM, this.ContaceInfo, {
        query: { companyName: companyName }, select: 'email'
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `phone`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error fetching tasks: ${error}`);
      next(error);
    }
  };
  public phoneEmail = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      const { companyName, personName } = request.body;
      const result = await MongoService.find(MONGO_DB_EXEM, this.ContaceInfo, {
        query: { companyName: companyName, personName: personName }, select: 'phone email'
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `phone`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error fetching tasks: ${error}`);
      next(error);
    }
  };




}

export default MeetingController;
