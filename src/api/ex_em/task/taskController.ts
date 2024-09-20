import { Router, Request, Response, NextFunction, query } from 'express';
import { ERROR_MESSAGES, NUMERICAL, ROUTES, STATUS_CODE, SUCCESS_MESSAGES, EMPTY, COMMON_CONSTANT } from "../../../constants";
import getconfig from '../../../config';
import { successMiddleware } from '../../../middleware/response.middleware';
import logger from '../../../logger';
import { MongoService } from '../../../utils/mongoService';
import taskModel from './task.model';
import taskValidation from './task.validation';
import authMiddleware from '../../../middleware/auth.middleware';
import { RequestWithAdmin } from '../../../interfaces/requestWithAdmin.interface';
import mongoose, { Query } from 'mongoose';
import uploadHandler from '../../../utils/multer';
import { validateFile } from '../../../utils/validationFunctions';
import { audioFileUploadHandle, fileUploadHandle, pdfFileUploadHandle, videoFileUploadHandle } from '../../../utils/fileUploadHandle';
import { Kafka } from 'aws-sdk';
import { log } from 'console';
import adminModel from '../../admin/admin.model';

const { MONGO_DB_EXEM } = getconfig();

class taskController {
  public path = `/${ROUTES.TASK}`;
  private validation = new taskValidation();
  public router = Router();
  public task = taskModel;
  public Admin = adminModel

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {

    this.router.post(
      `${this.path}/createTask`,
      authMiddleware,
      uploadHandler.fields([

        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
        { name: "document", maxCount: 1 }

      ]),
      this.createTask);

    this.router.post(
      `${this.path}/getTasks/:id`,
      authMiddleware,
      this.getTasks);

    this.router.put(
      `${this.path}/updateTask/:id`,
      authMiddleware,
      // this.validation.updateTaskValidation(),
      this.updateTask);

    this.router.delete(
      `${this.path}/deleteTask/:id`,

      authMiddleware,
      this.deleteTask);

    //====Routes for notes within tasks=====================================================================================
    this.router.post(
      `${this.path}/addnote/:id`,
      authMiddleware,
      uploadHandler.fields([

        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
        { name: "document", maxCount: 1 }

      ]),
      this.addNoteToTask); // Add a new note

    this.router.post(
      `${this.path}/updatenote`,
      authMiddleware,
      this.validation.updateNoteValidation,
      uploadHandler.fields([
        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
        { name: "document", maxCount: 1 }
      ]),
      this.updateNote
    );


    this.router.delete(
      `${this.path}/deletenote`,
      authMiddleware,
      this.validation.deleteNoteValidation(),
      this.deleteNote); // Delete a note



    this.router.post(
      `${this.path}/allUserDropdown`,
      authMiddleware,
      this.allUserDropdown);



    //==== OPEN ACTIVITY =====================================================================

    this.router.post(
      `${this.path}/taskOpenActivity`,
      authMiddleware,

      this.taskOpenActivity);

    this.router.post(
      `${this.path}/taskCompleteActivity`,
      authMiddleware,

      this.taskCompleteActivity);

  }


  public createTask = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
     
      const {
        taskOwner,
        companyName,
        subject,
        dueDate,
        relatedTo,
        status,
        assign,
        repeat,
        priority,
        reminder,
        text
      } = request.body;

      const notes = JSON.parse(request.body.notes);
      const text2 = notes.text;     
      let task = await MongoService.findOne(MONGO_DB_EXEM, this.task, {
        query: {
          taskOwner: taskOwner,
          companyName: companyName,
          subject: subject,
          dueDate: new Date(dueDate),
          relatedTo: relatedTo,
          status: status,
          assign: assign,
          repeat: repeat,
          priority: priority,
          reminder: new Date(reminder)
     
        }
      })

      if (task) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.ALREADY_EXISTS.replace(':attribute', 'task'));
      }

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


      console.log(req.body)
      const addTask = await MongoService.create(MONGO_DB_EXEM, this.task, {
        insert: {
          userAdminId: currentUserId,
          taskOwner: taskOwner,
          companyName: companyName,
          subject: subject,
          dueDate: dueDate,
          relatedTo: relatedTo,
          status: status,
          assign: assign,
          repeat: repeat,
          priority: priority,
          reminder: reminder,
          notes: {
            text:text2,
            photo: imagePictures,
            video: videoData,
            audio: audioData,
            documents: documentData

          },
        }
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', `Task`),
          data: addTask
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error creating task: ${error}`);
      next(error);
    }
  };

  // public createTask = async (
  //   request: Request,
  //   response: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     // Destructure request body and files
  //     const {
  //       taskOwner,
  //       companyName,
  //       subject,
  //       dueDate,
  //       relatedTo,
  //       status,
  //       assign,
  //       repeat,
  //       priority,
  //       reminder,
  //       text
  //     } = request.body;
  
  //     const files: any = request?.files;
  
  //     // Convert dates to ISO strings
  //     const dueDateISO = new Date(dueDate).toISOString();
  //     const reminderISO = new Date(reminder).toISOString();
  
  //     // Check if the task already exists
  //     let existingTask = await MongoService.findOne(MONGO_DB_EXEM, this.task, {
  //       query: {
  //         taskOwner,
  //         companyName,
  //         subject,
  //         dueDate: dueDateISO,
  //         relatedTo,
  //         status,
  //         assign,
  //         repeat,
  //         priority,
  //         reminder: reminderISO,
          

  //         // `notes` is an array, no need to compare it in this query
  //       }
  //     });
  
  //     if (existingTask) {
  //       response.statusCode = STATUS_CODE.BAD_REQUEST;
  //       throw new Error(ERROR_MESSAGES.COMMON.ALREADY_EXISTS.replace(':attribute', 'task'));
  //     }
  
  //     // Access current user ID
  //     const req = request as RequestWithAdmin;
  //     const currentUserId = req.user._id;
  
  //     // Handle file uploads
  //    const fileImageTasks = [{ type: 'image', fileArray: ['image'] }];
  //     const fileVideoTasks = [{ type: 'video', fileArray: ['video'] }];
  //     const fileAudioTasks = [{ type: 'audio', fileArray: ['audio'] }];
  //     const fileDocumentTasks = [{ type: 'document', fileArray: ['document'] }];

  //     for (let j = 0; j < files?.image?.length; j++) {
  //       const file = files?.image[j];
  //       await validateFile(/*res,*/  file, 'image', COMMON_CONSTANT.IMAGE_EXT_ARRAY, /*maxSizeCompany*/);

  //     }
  //     for (let j = 0; j < files?.video?.length; j++) {
  //       const file = files?.video[j];
  //       await validateFile(/*res,*/  file, 'video', COMMON_CONSTANT.VIDEO_EXT_ARRAY, /*maxSizeCompany*/);
  //     }
  //     for (let j = 0; j < files?.audio?.length; j++) {
  //       const file = files?.audio[j];
  //       await validateFile(/*res,*/  file, 'audio', COMMON_CONSTANT.AUDIO_EXT_ARRAY, /*maxSizeCompany*/);
  //     }
  //     for (let j = 0; j < files?.document?.length; j++) {
  //       const file = files?.document[j];
  //       await validateFile(/*res,*/  file, 'document', COMMON_CONSTANT.DOCUMENT_EXT_ARRAY, /*maxSizeCompany*/);
  //     }

  //     const { imagePictures } = await fileUploadHandle(files, fileImageTasks, false);
  //     const { videoData } = await videoFileUploadHandle(files, fileVideoTasks, false);
  //     const { audioData } = await audioFileUploadHandle(files, fileAudioTasks, false);
  //     const { documentData } = await pdfFileUploadHandle(files, fileDocumentTasks, false);

  
  //     // Insert new task into the database
  //     const newTask = await MongoService.create(MONGO_DB_EXEM, this.task, {
  //       insert: {
  //         userAdminId: currentUserId,
  //         taskOwner,
  //         companyName,
  //         subject,
  //         dueDate: dueDateISO,
  //         relatedTo,
  //         status,
  //         assign,
  //         repeat,
  //         priority,
  //         reminder: reminderISO,
  //         notes: {
  //           text:text,
  //           photo: imagePictures,
  //           video: videoData,
  //           audio: audioData,
  //           documents: documentData

  //         },
  //       }
  //     });
  
  //     // Add file data to notes if present
     
  
  //     // Respond with success message
  //     successMiddleware(
  //       {
  //         message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'Task'),
  //         data: newTask
  //       },
  //       request,
  //       response,
  //       next
  //     );
  //   } catch (error) {
  //     logger.error(`Error creating task: ${error}`);
  //     next(error);
  //   }
  // };


  public getTasks = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      
      const { id } = request.params;

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      const result = await MongoService.find(MONGO_DB_EXEM, this.task, {
        query: {  _id:id}
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

  public updateTask = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      console.log(updateData);
      

      if (!updateData) {

        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', `updateData`));

      }

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.task,
        {
          query: { _id: id },
          updateData: { $set: updateData },
          updateOptions: { new: true }
        }
      );

      if (!result) {
        return response.status(404).json({ message: 'Task not found' });
      }

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.UPDATE_SUCCESS.replace(':attribute', `Task`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error updating task: ${error}`);
      next(error);
    }
  };

  public deleteTask = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;
      const result = await MongoService.deleteOne(MONGO_DB_EXEM, this.task, {
        query: { _id: id }
      });

      if (!result.deletedCount) {
        return response.status(404).json({ message: 'Task not found' });
      }

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.DELETE_SUCCESS.replace(':attribute', `Task`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error deleting task: ${error}`);
      next(error);
    }
  };

  //====================================================================================================================


  public addNoteToTask = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { text } = request.body;
      const files: any = request?.files;

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      let task = await MongoService.findOne(MONGO_DB_EXEM, this.task, {
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
        this.task,
        {
          query: { _id: request.params.id },
          updateData: {
            $push: {
              notes: {
                text:text,
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


  public updateNote = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { text, taskId, noteId } = request.body;
      const files: any = request?.files;


      // Convert IDs to ObjectId  
      const taskObjectId = new mongoose.Types.ObjectId(taskId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      // Validate the existence of the task
      let task = await MongoService.findOne(MONGO_DB_EXEM, this.task, {
        query: { _id: taskObjectId }
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

      logger.info("============imagePictures", imagePictures);
      logger.info("============videoData", videoData);
      logger.info("============documentData", documentData);
      logger.info("============audioData", audioData);

      // Update the specific note in the notes array
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.task,
        {
          query: {
            _id: taskObjectId,
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
        return response.status(404).json({ message: 'Task or note not found' });
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


  public deleteNote = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      // Extract callId and noteId from request
      const { taskId, noteId } = request.body;



      // Convert `callId` and `noteId` to ObjectId
      const taskObjectId = new mongoose.Types.ObjectId(taskId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      // Perform the update operation
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.task,
        {
          query: { _id: taskObjectId, 'notes._id': noteObjectId },
          updateData: { $pull: { notes: { _id: noteObjectId } } },
          updateOptions: { new: true }
        }
      );

      // Handle case where no document was found
      if (!result || result.matchedCount === 0) {
        return response.status(404).json({ message: 'task not found or note not found' });
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

  public allUserDropdown = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {


      const result = await MongoService.find(MONGO_DB_EXEM, this.Admin, {
        query: {}, select: 'name'
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


  //========================================== =================== 

  public taskCompleteActivity = async (
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
       
  
        let queryCondition: any = { companyName: companyName , status:  "complete"}; 
       
        if (adminResult.role !== 'superAdmin') {
          queryCondition.userAdminId = currentUserId;
        }
  
        const result = await MongoService.find(MONGO_DB_EXEM, this.task, {
          query: queryCondition,
          // Fetch the tasks based on the determined query condition
          // select: 'subject dueDate taskOwner assign status'
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



  public taskOpenActivity = async (
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
       
  
        let queryCondition: any = { companyName: companyName , status: { $ne: "complete" }}; 
       
        if (adminResult.role !== 'superAdmin') {
          queryCondition.userAdminId = currentUserId;
        }
  
        // Fetch the tasks based on the determined query condition
        const result = await MongoService.find(MONGO_DB_EXEM, this.task, {
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
  
  
}

export default taskController;
