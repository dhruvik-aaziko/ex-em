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
import CallModel from './call.model';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { RequestWithAdmin } from '../../../interfaces/requestWithAdmin.interface';
import authMiddleware from '../../../middleware/auth.middleware';
import { validateFile } from '../../../utils/validationFunctions';
import { audioFileUploadHandle, fileUploadHandle, pdfFileUploadHandle, videoFileUploadHandle } from '../../../utils/fileUploadHandle';
import adminModel from '../../admin/admin.model';
import { authorize } from 'passport';

const { MONGO_DB_EXEM } = getconfig();

class CallController {
  public path = `/${ROUTES.CALL}`;
  public router = Router();
  public Call = CallModel;
  public Admin = adminModel

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {

    this.router.post(`${this.path}/createCall`,
      authMiddleware,
      uploadHandler.fields([
        { name: "audio", maxCount: 1 },

      ]),
      this.createCall);


    this.router.post(`${this.path}/getAllCalls`, authMiddleware, this.getAllCalls);

    this.router.put(`${this.path}/updateCall/:id`,
      uploadHandler.fields([
        { name: "audio", maxCount: 1 },
      ]),
      authMiddleware, this.updateCall);

    this.router.delete(`${this.path}/deleteCall/:id`, authMiddleware, this.deleteCall);

    //=========================================  Notes  ======================================================

    this.router.post(
      `${this.path}/addnote/:id`,
      authMiddleware,
      uploadHandler.fields([

        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
        { name: "document", maxCount: 1 }

      ]),
      this.addNoteToCall); // Add a new note

    this.router.post(
      `${this.path}/updatenote`,
      authMiddleware,
      uploadHandler.fields([
        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
        { name: "document", maxCount: 1 }
      ]),
      this.updateNoteInCall
    );


    this.router.delete(
      `${this.path}/deletenote`,
      authMiddleware,
      this.deleteNoteFromCall); // Delete a note

    //===============================================================================================

    this.router.post(
      `${this.path}/callOpenActivity`,
      authMiddleware,
      this.callOpenActivity);

    this.router.post(
      `${this.path}/callCompleteActivity`,
      authMiddleware,
      this.callCompleteActivity);

  }

  public createCall = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      const files: any = request?.files;
      const fileAudiocalls = [{ type: 'audio', fileArray: ['audio'] }];
      for (let j = 0; j < files?.audio?.length; j++) {
        const file = files?.audio[j];
        await validateFile(/*res,*/  file, 'audio', COMMON_CONSTANT.AUDIO_EXT_ARRAY, /*maxSizeCompany*/);
      }

      const { audioData } = await audioFileUploadHandle(files, fileAudiocalls, false);
      const {
        name,
        agent,
        phoneNo,
        company,
        position,
        callType,
        callStatus,
        scheduledAt,
        callDuration,
        subject,
        voiceRecording,
        callPurpose,
        callResult,
        description,
        text
      } = request.body;
      console.log("---------------request.body------------------", request.body)
      const result = await MongoService.create(MONGO_DB_EXEM, this.Call, {
        insert: {
          name: name,
          userAdminId: currentUserId,
          agent: agent,
          phoneNo: phoneNo,
          company: company,
          position: position,
          callType: callType,
          callStatus: callStatus,
          scheduledAt: scheduledAt,
          callDuration: callDuration,
          subject: subject,
          voiceRecording: audioData,
          callPurpose: callPurpose,
          callResult: callResult,
          description: description,
          notes: {
            text: text,
          }
        }
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
        query: { company: companyName }
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
      const {
        name,
        agent,
        phoneNo,
        company,
        position,
        callType,
        callStatus,
        scheduledAt,
        callDuration,
        subject,
        callPurpose,
        callResult,
        description,
      } = request.body;
      const files: any = request?.files;

      const fileAudioTasks = [{ type: 'audio', fileArray: ['audio'] }];
      const { audioData } = await audioFileUploadHandle(files, fileAudioTasks, false);


      for (const file of files?.audio || []) {
        await validateFile(file, 'audio', COMMON_CONSTANT.AUDIO_EXT_ARRAY);
      }

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Call,
        {
          query: { _id: id },
          updateData: {
            $set: {
              name: name,
              agent: agent,
              phoneNo: phoneNo,
              company: company,
              position: position,
              callType: callType,
              callStatus: callStatus,
              scheduledAt: scheduledAt,
              callDuration: callDuration,
              subject: subject,
              voiceRecording: audioData,
              callPurpose: callPurpose,
              callResult: callResult,
              description: description,
            }
          },
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

  //=====================================================================================================================+++++++++++++--------**********+-*/-+*/-----------------


  public addNoteToCall = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { text } = request.body;
      const files: any = request?.files;

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      let call = await MongoService.findOne(MONGO_DB_EXEM, this.Call, {
        query: {
          _id: request.params.id,
          userAdminId: currentUserId
        }
      })
      if (!call) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'call'));
      }

      const fileImagecalls = [{ type: 'image', fileArray: ['image'] }];
      const fileVideocalls = [{ type: 'video', fileArray: ['video'] }];
      const fileAudiocalls = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentcalls = [{ type: 'document', fileArray: ['document'] }];

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

      const { imagePictures } = await fileUploadHandle(files, fileImagecalls, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideocalls, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudiocalls, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentcalls, false);

      logger.info("============imagePictures", imagePictures)
      logger.info("============videoData", videoData)
      logger.info("============documentData", documentData)
      logger.info("============audioData", audioData)

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Call,
        {
          query: { _id: request.params.id },
          updateData: {
            $push: {
              notes: {
                text: text,
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

      logger.info("============result", result)

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.ADD_SUCCESS.replace(':attribute', `note`),
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
      const { text, callId, noteId } = request.body;
      const files: any = request?.files;


      // Convert IDs to ObjectId  
      const callObjectId = new mongoose.Types.ObjectId(callId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      // Validate the existence of the call
      let call = await MongoService.findOne(MONGO_DB_EXEM, this.Call, {
        query: { _id: callObjectId }
      });
      if (!call) {
        return response.status(404).json({ message: ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'call') });
      }

      // Validate and handle files
      const fileImagecalls = [{ type: 'image', fileArray: ['image'] }];
      const fileVideocalls = [{ type: 'video', fileArray: ['video'] }];
      const fileAudiocalls = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentcalls = [{ type: 'document', fileArray: ['document'] }];

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
      const { imagePictures } = await fileUploadHandle(files, fileImagecalls, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideocalls, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudiocalls, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentcalls, false);

      logger.info("============imagePictures", imagePictures);
      logger.info("============videoData", videoData);
      logger.info("============documentData", documentData);
      logger.info("============audioData", audioData);

      // Update the specific note in the notes array
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Call,
        {
          query: {
            _id: callObjectId,
            'notes._id': noteObjectId
          },
          updateData: {
            $set: {
              'notes.$.text': text,
              'notes.$.photo': imagePictures,
              'notes.$.video': videoData,
              'notes.$.audio': audioData,
              'notes.$.documents': documentData
            }
          },
          updateOptions: { new: true }
        }
      );

      if (!result) {
        return response.status(404).json({ message: 'call or note not found' });
      }

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.UPDATE_SUCCESS.replace(':attribute', 'note'),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error updating note: `);
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
        return response.status(404).json({ message: 'call not found or note not found' });
      }

      // Successful response
      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.DELETE_SUCCESS.replace(':attribute', `note`),
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

 
  //=============================

  public callCompleteActivity = async (
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


     
      // let queryCondition: any = { company: companyName, callStatus: "complete" };
      let queryCondition: any = {
        company: companyName,
      // scheduledAt: { $exists: true } 
      callResult: { $nin: ["dead_lead", "invalid_no"] }

    };

      if (adminResult.role !== 'superAdmin') {
        queryCondition.userAdminId = currentUserId;
      }

      const result = await MongoService.find(MONGO_DB_EXEM, this.Call, {
        query: queryCondition,
        // Fetch the calls based on the determined query condition
        // select: 'subject dueDate callOwner assign status'
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `call`),
          data: result
        },
        request,
        response,
        next

      );
    } catch (error) {
      logger.error(`Error fetching calls: ${error}`);
      next(error);
    }
  };





  public callOpenActivity = async (
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


      // let queryCondition: any = { company: companyName, callStatus: { $ne: "complete" } };
      
      let queryCondition: any = {
        company: companyName,
        // scheduledAt: { $exists: true } 
        callResult: { $nin: ["dead_lead", "invalid_no"] }
    };
    
      if (adminResult.role !== 'superAdmin') {
        queryCondition.userAdminId = currentUserId;
      }

      // Fetch the calls based on the determined query condition
      const result = await MongoService.find(MONGO_DB_EXEM, this.Call, {
        query: queryCondition

      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `call`),
          data: result
        },
        request,
        response,
        next
      );

    } catch (error) {
      logger.error(`Error fetching calls: ${error}`);
      next(error);
    }
  };
}

export default CallController;
