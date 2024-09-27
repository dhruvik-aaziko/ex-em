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
import FollowUpModel from './followUp.model';
import mongoose from 'mongoose';
import { RequestWithAdmin } from '../../../interfaces/requestWithAdmin.interface';
import authMiddleware from '../../../middleware/auth.middleware';
import { validateFile } from '../../../utils/validationFunctions';
import { audioFileUploadHandle, fileUploadHandle, pdfFileUploadHandle, videoFileUploadHandle } from '../../../utils/fileUploadHandle';
import adminModel from '../../admin/admin.model';
import followUpModel from './followUp.model';
import callModel from '../call/call.model';
import { deleteFromS3 } from '../../../utils/s3';

const { MONGO_DB_EXEM } = getconfig();

class FollowUpController {
  public path = `/${ROUTES.FollowUp}`;
  public router = Router();
  public FollowUp = followUpModel;
  public Admin = adminModel;
  public Call = callModel;


  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {

    this.router.post(`${this.path}/createFollowUp`,
      authMiddleware,
      uploadHandler.fields([
        { name: "audio", maxCount: 1 },
      ]),
      this.createFollowUp);


    this.router.post(`${this.path}/getAllFollowUps`, authMiddleware, this.getAllFollowUps);

    this.router.put(`${this.path}/updateFollowUp/:id`,
      uploadHandler.fields([
        { name: "audio", maxCount: 1 },
      ]),
      authMiddleware, this.updateFollowUp);

    this.router.delete(`${this.path}/deleteFollowUp/:id`, authMiddleware, this.deleteFollowUp);

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
      this.addNoteToFollowUp); // Add a new note

    this.router.post(
      `${this.path}/updatenote`,
      authMiddleware,
      uploadHandler.fields([
        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
        { name: "document", maxCount: 1 }
      ]),
      this.updateNoteInFollowUp
    );


    this.router.delete(
      `${this.path}/deletenote`,
      authMiddleware,
      this.deleteNoteFromFollowUp); // Delete a note

    //=====================================================////////==========================================

    this.router.post(
      `${this.path}/FollowUpOpenActivity`,
      authMiddleware,
      this.FollowUpOpenActivity);

    this.router.post(
      `${this.path}/FollowUpCompleteActivity`,
      authMiddleware,
      this.FollowUpCompleteActivity);

  }

  public createFollowUp = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;


      const {
        name, companyName, position, callType, outgoingStatus, dateTime, agent, subject, callResult, callPurpose, text, assigne

      } = request.body;
      console.log("---------------request.body------------------", request.body)
      const result = await MongoService.create(MONGO_DB_EXEM, this.FollowUp, {
        insert: {
          name: name,
          userAdminId: currentUserId,
          assigne: assigne,
          companyName: companyName,
          position: position,
          callType: callType,
          outgoingStatus: outgoingStatus,
          dateTime: dateTime,
          agent: agent,
          subject: subject,
          callResult: callResult,
          callPurpose: callPurpose,
          notes: {
            text: text,
          }
        }
      });

      successMiddleware(
        {
          message: 'FollowUp created successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error creating FollowUp: ${error}`);
      next(error);
    }
  };

  public getAllFollowUps = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { companyName } = request.body
      const result = await MongoService.find(MONGO_DB_EXEM, this.FollowUp, {
        query: { companyName: companyName }
      });

      successMiddleware(
        {
          message: 'FollowUps fetched successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error fetching FollowUps: ${error}`);
      next(error);
    }
  };

  public updateFollowUp = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;
      const {
        name, companyName, position, callType, outgoingStatus, dateTime, agent, subject, callResult, callPurpose, assigne
      } = request.body;

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.FollowUp,
        {
          query: { _id: id },
          updateData: {
            $set: {
              name: name,
              companyName: companyName,
              assigne: assigne,
              position: position,
              callType: callType,
              outgoingStatus: outgoingStatus,
              dateTime: dateTime,
              agent: agent,
              subject: subject,
              callResult: callResult,
              callPurpose: callPurpose
            }
          },
          updateOptions: { new: true }
        }
      );

      if (!result) {
        return response.status(404).json({ message: 'FollowUp not found' });
      }

      successMiddleware(
        {
          message: 'FollowUp updated successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error updating FollowUp: ${error}`);
      next(error);
    }
  };

  //delete s3done with 

  public deleteFollowUp = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;

      const taskToDelete = await MongoService.findOne(MONGO_DB_EXEM, this.FollowUp, {
        query: { _id: id }
      });

      if (!taskToDelete) {
        return response.status(404).json({ message: 'Task not found' });
      }

      // Gather all file URLs from the notes
      const fileKeys = taskToDelete.notes.flatMap((note: { video: any[]; photo: any[]; audio: any[]; documents: any[]; }) => [
        ...note.video.map((url: string) => url.split('/').slice(3).join('/')),
        ...note.photo.map((url: string) => url.split('/').slice(3).join('/')),
        ...note.audio.map((url: string) => url.split('/').slice(3).join('/')),
        ...note.documents.map((url: string) => url.split('/').slice(3).join('/'))
      ]);

      // Delete files from S3
      const deletePromises = fileKeys.map((key: string) => deleteFromS3(key));
      await Promise.all(deletePromises);

      const result = await MongoService.deleteOne(MONGO_DB_EXEM, this.FollowUp, {
        query: { _id: id }
      });

      if (!result.deletedCount) {
        return response.status(404).json({ message: 'FollowUp not found' });
      }

      successMiddleware(
        {
          message: 'FollowUp deleted successfully',
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error deleting FollowUp: ${error}`);
      next(error);
    }
  };

  //================================================================================///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\


  public addNoteToFollowUp = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { text } = request.body;
      const files: any = request?.files;

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      let FollowUp = await MongoService.findOne(MONGO_DB_EXEM, this.FollowUp, {
        query: {
          _id: request.params.id,
          userAdminId: currentUserId
        }
      })
      if (!FollowUp) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'FollowUp'));
      }

      const fileImageFollowUps = [{ type: 'image', fileArray: ['image'] }];
      const fileVideoFollowUps = [{ type: 'video', fileArray: ['video'] }];
      const fileAudioFollowUps = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentFollowUps = [{ type: 'document', fileArray: ['document'] }];

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

      const { imagePictures } = await fileUploadHandle(files, fileImageFollowUps, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideoFollowUps, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudioFollowUps, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentFollowUps, false);

      console.log("imagePictures=================",imagePictures);
      

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.FollowUp,
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


  public updateNoteInFollowUp = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { text, FollowUpId, noteId } = request.body;
      const files: any = request?.files;



      const FollowUpObjectId = new mongoose.Types.ObjectId(FollowUpId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);


      let FollowUp = await MongoService.findOne(MONGO_DB_EXEM, this.FollowUp, {
        query: { _id: FollowUpObjectId }
      });
      if (!FollowUp) {
        return response.status(404).json({ message: ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'FollowUp') });
      }
      // Extract the existing note to delete old files
      const existingNote = FollowUp.notes.find((note: { _id: { equals: (arg0: mongoose.Types.ObjectId) => any; }; }) => note._id.equals(noteObjectId));
      if (!existingNote) {
        return response.status(404).json({ message: ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'note') });
      }
      const oldFileKeys = [
        ...existingNote.photo.map((url: string) => url.split('/').slice(3).join('/')),
        ...existingNote.audio.map((url: string) => url.split('/').slice(3).join('/')),
        ...existingNote.video.map((url: string) => url.split('/').slice(3).join('/')),
        ...existingNote.documents.map((url: string) => url.split('/').slice(3).join('/'))
      ];
      // Validate and handle files
      const fileImageFollowUps = [{ type: 'image', fileArray: ['image'] }];
      const fileVideoFollowUps = [{ type: 'video', fileArray: ['video'] }];
      const fileAudioFollowUps = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentFollowUps = [{ type: 'document', fileArray: ['document'] }];

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
      const { imagePictures } = await fileUploadHandle(files, fileImageFollowUps, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideoFollowUps, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudioFollowUps, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentFollowUps, false);


      // Delete old files from S3
      const deletePromises = oldFileKeys.map(key => deleteFromS3(key));
      await Promise.all(deletePromises);

      // Update the specific note in the notes array
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.FollowUp,
        {
          query: {
            _id: FollowUpObjectId,
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
        return response.status(404).json({ message: 'FollowUp or note not found' });
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


  public deleteNoteFromFollowUp = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      // Extract FollowUpId and noteId from request
      const { FollowUpId, noteId } = request.body;



      // Convert `FollowUpId` and `noteId` to ObjectId
      const FollowUpObjectId = new mongoose.Types.ObjectId(FollowUpId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      const task = await MongoService.findOne(
        MONGO_DB_EXEM,
        this.FollowUp,
        {
          query: { _id: FollowUpObjectId, 'notes._id': noteObjectId }
        }
      );

      // Handle case where no task is found
      if (!task) {
        return response.status(404).json({ message: 'Task not found or note not found' });
      }

      // Extract the note to be deleted
      const noteToDelete = task.notes.find((note: any) => note._id.equals(noteObjectId));

      // Prepare to delete files from S3 by extracting keys
      const fileKeys = [
        ...noteToDelete.photo.map((url: string) => url.split('/').slice(3).join('/')),
        ...noteToDelete.audio.map((url: string) => url.split('/').slice(3).join('/')),
        ...noteToDelete.video.map((url: string) => url.split('/').slice(3).join('/')),
        ...noteToDelete.documents.map((url: string) => url.split('/').slice(3).join('/'))
      ];

      // Perform the update operation
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.FollowUp,
        {
          query: { _id: FollowUpObjectId, 'notes._id': noteObjectId },
          updateData: { $pull: { notes: { _id: noteObjectId } } },
          updateOptions: { new: true }
        }
      );

      // Handle case where no document was found
      if (!result || result.matchedCount === 0) {
        return response.status(404).json({ message: 'FollowUp not found or note not found' });
      }

      // Delete files from S3
      const deletePromises = fileKeys.map(key => deleteFromS3(key));
      await Promise.all(deletePromises);

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

  public FollowUpCompleteActivity = async (
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


      let queryCondition: any = { company: companyName, FollowUpStatus: "complete" };

      if (adminResult.role !== 'superAdmin') {
        queryCondition.userAdminId = currentUserId;
      }

      const result = await MongoService.find(MONGO_DB_EXEM, this.FollowUp, {
        query: queryCondition,
        // Fetch the FollowUps based on the determined query condition
        // select: 'subject dueDate FollowUpOwner assign status'
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `FollowUp`),
          data: result
        },
        request,
        response,
        next

      );
    } catch (error) {
      logger.error(`Error fetching FollowUps: ${error}`);
      next(error);
    }
  };





  public FollowUpOpenActivity = async (
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


      let queryCondition: any = { companyName: companyName, FollowUpStatus: { $ne: "complete" } };

      if (adminResult.role !== 'superAdmin') {
        queryCondition.userAdminId = currentUserId;
      }

      // Fetch the FollowUps based on the determined query condition
      const result = await MongoService.find(MONGO_DB_EXEM, this.Call, {
        query: {
          company: companyName,
          userAdminId: currentUserId,
          //  createdAt: { $ne: new Date() },
          callResult: { $ne: "dead_lead" }
        }


      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `FollowUp`),
          data: result
        },
        request,
        response,
        next
      );

    } catch (error) {
      logger.error(`Error fetching FollowUps: ${error}`);
      next(error);
    }
  };

}

export default FollowUpController;
