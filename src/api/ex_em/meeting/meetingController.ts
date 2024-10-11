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
import { deleteFromS3 } from '../../../utils/s3';

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

    this.router.post(`${this.path}/getMeetings/:id`, authMiddleware, this.getMeetings);
    this.router.put(`${this.path}/updateMeeting/:id`, authMiddleware, uploadHandler.none(), this.updateMeeting);
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

    this.router.delete(`${this.path}/deletenote`, authMiddleware, uploadHandler.none(), this.deleteNote); // Delete a note


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

    this.router.post(
      `${this.path}/meetingAllActivity`,
      authMiddleware,
      this.meetingAllActivity);


  }

  public createMeeting = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { title, companyName, countryName, industry, personName, phoneNo, emailID, notStarted, position, dateTime, host, location, participants, status, text, RescheduleAt }
        = request.body;

      console.log("this is meeting body ", request.body)
      if (request.body.notes) {
        const notesObject = JSON.parse(request.body.notes);
        var text2 = notesObject.text;
        console.log(text2);
      }

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      const files: any = request?.files;

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
          userAdminId: currentUserId, title: title, companyName: companyName, countryName: countryName, industry: industry, personName: personName,
          phoneNo: phoneNo, emailID: emailID, notStarted: notStarted, position: position, dateTime: dateTime, host: host, location: location,
          participants: participants, status: status,
          notes: {
            text: text2 || "",
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

  public getMeetings = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { companyName } = request.body
      const result = await MongoService.findOne(MONGO_DB_EXEM, this.Meeting, {
        query: { _id: request.params.id },
        select: 'notes'

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
      const {

        title, companyName, countryName, industry, personName, phoneNo, emailID, notStarted,
        position, dateTime, host, location, participants, status, rescheduleNote, RescheduleAt

      }
        = request.body;

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Meeting,
        {
          query: { _id: id },
          updateData: {
            $set: {
              title: title, companyName: companyName, countryName: countryName, industry: industry, personName: personName,
              phoneNo: phoneNo, emailID: emailID, notStarted: notStarted, position: position, dateTime: dateTime, host: host, location: location,
              participants: participants, status: status
            }
          },
          updateOptions: { new: true }
        }
      );

      if (rescheduleNote) {
        const result = await MongoService.findOneAndUpdate(
          MONGO_DB_EXEM,
          this.Meeting,
          {
            query: { _id: id },
            updateData: {
              $push: {
                notes: {
                  text: rescheduleNote,
                  RescheduleAt: RescheduleAt

                },

              }
            },
            updateOptions: { new: true }
          }
        );


        return successMiddleware(
          {
            message: 'Meeting and Reason Note updated successfully',
            data: result
          },
          request,
          response,
          next
        );


      }
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

      // Step 1: Retrieve the meeting to get associated files
      const meeting = await MongoService.findOne(MONGO_DB_EXEM, this.Meeting, {
        query: { _id: id }
      });

      if (!meeting) {
        return response.status(404).json({ message: 'Meeting not found' });
      }

      // Step 2: Extract file URLs to delete from S3
      const fileKeys = [
        ...meeting.notes.flatMap((note: any) => note.photo.map((url: string) => url.split('/').slice(3).join('/'))),
        ...meeting.notes.flatMap((note: any) => note.audio.map((url: string) => url.split('/').slice(3).join('/'))),
        ...meeting.notes.flatMap((note: any) => note.video.map((url: string) => url.split('/').slice(3).join('/'))),
        ...meeting.notes.flatMap((note: any) => note.documents.map((url: string) => url.split('/').slice(3).join('/')))
      ];

      // Step 3: Delete files from S3
      const deletePromises = fileKeys.map(key => deleteFromS3(key));
      await Promise.all(deletePromises);

      // Step 4: Delete the meeting from the database
      const result = await MongoService.deleteOne(MONGO_DB_EXEM, this.Meeting, {
        query: { _id: id }
      });

      if (!result.deletedCount) {
        return response.status(404).json({ message: 'Meeting not found' });
      }

      // Step 5: Send success response
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

      const { text, RescheduleAt } = request.body;

      const files: any = request?.files;

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      let meeting = await MongoService.findOne(MONGO_DB_EXEM, this.Meeting, {
        query: {
          _id: request.params.id,
          userAdminId: currentUserId
        }
      })
      if (!meeting) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'meeting'));
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

                text: text,
                RescheduleAt: RescheduleAt,
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
        const { text, RescheduleAt, meetingId, noteId, image, video, audio, document } = request.body;
        const meetingObjectId = new mongoose.Types.ObjectId(meetingId);
        const noteObjectId = new mongoose.Types.ObjectId(noteId);
        const files: any = request?.files;
        console.log("this is body  ",request.body);
        
        console.log("this is new file ",files);
        

        // Validate the existence of the meeting
        let meeting = await MongoService.findOne(MONGO_DB_EXEM, this.Meeting, {
            query: { _id: meetingObjectId }
        });
        if (!meeting) {
            return response.status(404).json({ message: ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'meeting') });
        }

        // Extract the existing note
        const existingNote = meeting.notes.find((note: { _id: { equals: (arg0: mongoose.Types.ObjectId) => any; }; }) => note._id.equals(noteObjectId));
        if (!existingNote) {
            return response.status(404).json({ message: ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'note') });
        }

        const oldFileKeys = [
            ...existingNote.photo.map((url: string) => url.split('/').slice(3).join('/')),
            ...existingNote.audio.map((url: string) => url.split('/').slice(3).join('/')),
            ...existingNote.video.map((url: string) => url.split('/').slice(3).join('/')),
            ...existingNote.documents.map((url: string) => url.split('/').slice(3).join('/'))
        ];

        // Initialize upload data
        let imagePictures = existingNote.photo;
        let videoData = existingNote.video;
        let audioData = existingNote.audio;
        let documentData = existingNote.documents;

        // Handle file uploads if new files are provided
        if (files) {
            // Validate and upload new files
            if (files.image && files.image.length > 0) {
                await Promise.all(files.image.map((file: any) => validateFile(file, 'image', COMMON_CONSTANT.IMAGE_EXT_ARRAY)));
                const { imagePictures: newImages } = await fileUploadHandle(files, [{ type: 'image', fileArray: ['image'] }], false);
                imagePictures = newImages; // Update if new images were uploaded
            }
            if (files.video && files.video.length > 0) {
                await Promise.all(files.video.map((file: any) => validateFile(file, 'video', COMMON_CONSTANT.VIDEO_EXT_ARRAY)));
                const { videoData: newVideos } = await videoFileUploadHandle(files, [{ type: 'video', fileArray: ['video'] }], false);
                videoData = newVideos; // Update if new videos were uploaded
            }
            if (files.audio && files.audio.length > 0) {
                await Promise.all(files.audio.map((file: any) => validateFile(file, 'audio', COMMON_CONSTANT.AUDIO_EXT_ARRAY)));
                const { audioData: newAudios } = await audioFileUploadHandle(files, [{ type: 'audio', fileArray: ['audio'] }], false);
                audioData = newAudios; // Update if new audio files were uploaded
            }
            if (files.document && files.document.length > 0) {
                await Promise.all(files.document.map((file: any) => validateFile(file, 'document', COMMON_CONSTANT.DOCUMENT_EXT_ARRAY)));
                const { documentData: newDocuments } = await pdfFileUploadHandle(files, [{ type: 'document', fileArray: ['document'] }], false);
                documentData = newDocuments; // Update if new documents were uploaded
            }
        }

        // Remove files that don't exist in the request body
        if (!image) {
            imagePictures.forEach(async (key: string) => await deleteFromS3(key)); // Delete from S3
            imagePictures = []; // Clear database reference
        }
        if (!video) {
            videoData.forEach(async (key: string) => await deleteFromS3(key)); // Delete from S3
            videoData = []; // Clear database reference
        }
        if (!audio) {
            audioData.forEach(async (key: string) => await deleteFromS3(key)); // Delete from S3
            audioData = []; // Clear database reference
        }
        if (!document) {
            documentData.forEach(async (key: string) => await deleteFromS3(key)); // Delete from S3
            documentData = []; // Clear database reference
        }

        // Update the note in the database
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




  // public updateNote = async (
  //   request: Request,
  //   response: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     // Extract the data from the request body
  //     const { text, RescheduleAt, meetingId, noteId } = request.body;

  //     console.log("this is body ",request.body)
  //     const meetingObjectId = new mongoose.Types.ObjectId(meetingId);
  //     const noteObjectId = new mongoose.Types.ObjectId(noteId);

  //     const files: any = request?.files;

  //     console.log("this is file ",files);




  //     // Validate the existence of the meeting
  //     let meeting = await MongoService.findOne(MONGO_DB_EXEM, this.Meeting, {
  //       query: { _id: meetingObjectId }
  //     });
  //     if (!meeting) {
  //       return response.status(404).json({ message: ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'meeting') });
  //     }

  //     // Extract the existing note to delete old files
  //     const existingNote = meeting.notes.find((note: { _id: { equals: (arg0: mongoose.Types.ObjectId) => any; }; }) => note._id.equals(noteObjectId));
  //     if (!existingNote) {
  //       return response.status(404).json({ message: ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'note') });
  //     }
  //     const oldFileKeys = [
  //       ...existingNote.photo.map((url: string) => url.split('/').slice(3).join('/')),
  //       ...existingNote.audio.map((url: string) => url.split('/').slice(3).join('/')),
  //       ...existingNote.video.map((url: string) => url.split('/').slice(3).join('/')),
  //       ...existingNote.documents.map((url: string) => url.split('/').slice(3).join('/'))
  //     ];

  //     // Validate and handle files
  //     const fileImageTasks = [{ type: 'image', fileArray: ['image'] }];
  //     const fileVideoTasks = [{ type: 'video', fileArray: ['video'] }];
  //     const fileAudioTasks = [{ type: 'audio', fileArray: ['audio'] }];
  //     const fileDocumentTasks = [{ type: 'document', fileArray: ['document'] }];

  //     for (const file of files?.image || []) {
  //       await validateFile(file, 'image', COMMON_CONSTANT.IMAGE_EXT_ARRAY);
  //     }
  //     for (const file of files?.video || []) {
  //       await validateFile(file, 'video', COMMON_CONSTANT.VIDEO_EXT_ARRAY);
  //     }
  //     for (const file of files?.audio || []) {
  //       await validateFile(file, 'audio', COMMON_CONSTANT.AUDIO_EXT_ARRAY);
  //     }
  //     for (const file of files?.document || []) {
  //       await validateFile(file, 'document', COMMON_CONSTANT.DOCUMENT_EXT_ARRAY);
  //     }

  //     // Handle file uploads
  //     const { imagePictures } = await fileUploadHandle(files, fileImageTasks, false);
  //     const { videoData } = await videoFileUploadHandle(files, fileVideoTasks, false);
  //     const { audioData } = await audioFileUploadHandle(files, fileAudioTasks, false);
  //     const { documentData } = await pdfFileUploadHandle(files, fileDocumentTasks, false);


  //     const result = await MongoService.findOneAndUpdate(
  //       MONGO_DB_EXEM,
  //       this.Meeting,
  //       {
  //         query: {
  //           _id: meetingObjectId,
  //           'notes._id': noteObjectId
  //         },
  //         updateData: {
  //           $set: {
  //             'notes.$.text': text,
  //             'notes.$.RescheduleAt': RescheduleAt,
  //             'notes.$.photo': imagePictures,
  //             'notes.$.video': videoData,
  //             'notes.$.audio': audioData,
  //             'notes.$.documents': documentData
  //           }
  //         },
  //         updateOptions: { new: true }
  //       }
  //     );

  //     const deletePromises = oldFileKeys.map(key => deleteFromS3(key));
  //     await Promise.all(deletePromises);
  //     // Check if the result is valid
  //     if (!result) {
  //       return response.status(404).json({ message: 'Contact info or note not found' });
  //     }

  //     // Send success response
  //     successMiddleware(
  //       {
  //         message: 'Note updated successfully',
  //         data: result
  //       },
  //       request,
  //       response,
  //       next
  //     );
  //   } catch (error) {
  //     // Log error and pass to the error handler middleware
  //     logger.error(`Error updating note: ${error}`);
  //     next(error);
  //   }
  // };


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
        return response.status(400).json({ message: 'meeting ID and note ID are required' });
      }

      // Convert `callId` and `noteId` to ObjectId
      const meetingObjectId = new mongoose.Types.ObjectId(meetingId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      const meeting = await MongoService.findOne(
        MONGO_DB_EXEM,
        this.Meeting,
        {
          query: { _id: meetingObjectId, 'notes._id': noteObjectId }
        }
      );

      // Handle case where no meeting is found
      if (!meeting) {
        return response.status(404).json({ message: 'meeting not found or note not found' });
      }

      // Extract the note to be deleted
      const noteToDelete = meeting.notes.find((note: any) => note._id.equals(noteObjectId));

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
      // Delete files from S3
      const deletePromises = fileKeys.map(key => deleteFromS3(key));
      await Promise.all(deletePromises);
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
        // select: 'subject dueDate taskOwner assign status'
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `meeting`),
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
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `meeting`),
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


  public meetingAllActivity = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      // const { companyName } = request.body;
      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      // // Fetch the role of the current user
      // const adminResults = await MongoService.find(MONGO_DB_EXEM, this.Admin, {
      //   query: { _id: currentUserId },
      //   select: 'role'
      // });



      // const adminResult = adminResults[0];


      // // let queryCondition: any = { companyName: companyName, status: { $ne: "complete" } };
      // let queryCondition: any = { };

      // if (adminResult.role !== 'superAdmin') {
      //   queryCondition.userAdminId = currentUserId;
      // }

      const result = await MongoService.find(MONGO_DB_EXEM, this.Meeting, {
        query: {}

      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `All Meeting`),
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
