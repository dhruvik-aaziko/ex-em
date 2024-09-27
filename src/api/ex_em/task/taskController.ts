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
import adminModel from '../../admin/admin.model';
import { deleteFromS3 } from '../../../utils/s3';

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
      uploadHandler.none(),
      this.updateTask);

    this.router.delete(
      `${this.path}/deleteTask/:id`,

      authMiddleware,
      this.deleteTask);

    //====Routes for notes within tasks=====================================================================================
    this.router.post(
      `${this.path}/addnote/:id`,
      // this.validation.addNoteToTaskValidation(),
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
      // this.validation.updateNoteValidation(),
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
      this.deleteNoteS3); // Delete a note



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

    this.router.post(
      `${this.path}/taskAllActivity`,
      authMiddleware,
      this.taskAllActivity);

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
      console.log(request.body);



      if (request.body.notes) {
        const notesObject = JSON.parse(request.body.notes);
        var text2 = notesObject.text;
        console.log(text2);
      }


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
            text: text2,
            // text:firstNoteText,
            // text:text2,
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

  public getTasks = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      const { id } = request.params;

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      const result = await MongoService.findOne(MONGO_DB_EXEM, this.task, {
        query: { _id: id },
        select: "notes"
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
      console.log("this is call id who get in param ", request.params);

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
      } = request.body;

      console.log("this is body updateTask Body", (request.body));
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.task,
        {
          query: { _id: id },
          updateData: {
            $set: {
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
            }
          },
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
 //delete s3done with 
  public deleteTask = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;

     

      // Find the task to retrieve any associated files
      const taskToDelete = await MongoService.findOne(MONGO_DB_EXEM, this.task, {
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

      // Proceed to delete the task
      const result = await MongoService.deleteOne(MONGO_DB_EXEM, this.task, {
        query: { _id: id }
      });

      // Check if the task was successfully deleted
      if (!result.deletedCount) {
        return response.status(404).json({ message: 'Task not found' });
      }

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.DELETE_SUCCESS.replace(':attribute', 'Task'),
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

      console.log("this is add note task body ", request.body)

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

      // logger.info("============imagePictures", imagePictures)
      // logger.info("============videoData", videoData)
      // logger.info("============documentData", documentData)
      // logger.info("============audioData", audioData)

      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.task,
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

      console.log("============result", result);


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

  //delete s3done with 
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

      // Extract the existing note to delete old files
      const existingNote = task.notes.find((note: { _id: { equals: (arg0: mongoose.Types.ObjectId) => any; }; }) => note._id.equals(noteObjectId));
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

      // Delete old files from S3
      const deletePromises = oldFileKeys.map(key => deleteFromS3(key));
      await Promise.all(deletePromises);

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
      logger.error(`Error updating note: ${error}`);
      next(error);
    }
  };

  // private deleteFile = async (req: Request, res: Response) => {
  //   const { key } = req.body; // Assuming the key is sent in the request body

  //   if (!key) {
  //     return res.status(400).json({ message: 'Key is required.' });
  //   }

  //   try {
  //     const result = await deleteFromS3(key);
  //     return res.status(200).json({ message: 'File deleted successfully.', data: result });
  //   } catch (error) {
  //     console.error('Error deleting file:', error);
  //     return res.status(500).json({ message: 'Error deleting file.', error });
  //   }
  // };

  
  // public deleteNote = async (
  //   request: Request,
  //   response: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     // Extract callId and noteId from request
  //     const { taskId, noteId } = request.body;



  //     // Convert `callId` and `noteId` to ObjectId
  //     const taskObjectId = new mongoose.Types.ObjectId(taskId);
  //     const noteObjectId = new mongoose.Types.ObjectId(noteId);

  //     // Perform the update operation
  //     const result = await MongoService.findOneAndUpdate(
  //       MONGO_DB_EXEM,
  //       this.task,
  //       {
  //         query: { _id: taskObjectId, 'notes._id': noteObjectId },
  //         updateData: { $pull: { notes: { _id: noteObjectId } } },
  //         updateOptions: { new: true }
  //       }
  //     );

  //     // Handle case where no document was found
  //     if (!result || result.matchedCount === 0) {
  //       return response.status(404).json({ message: 'task not found or note not found' });
  //     }

  //     // Successful response
  //     successMiddleware(
  //       {
  //         message: SUCCESS_MESSAGES.COMMON.DELETE_SUCCESS.replace(':attribute', `note`),
  //         data: result
  //       },
  //       request,
  //       response,
  //       next
  //     );
  //   } catch (error) {
  //     // Log error and pass to the error handler middleware
  //     logger.error(`Error deleting note: ${error}`);
  //     next(error);
  //   }

  // }

//delete s3done with 
  public deleteNoteS3 = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      // Extract taskId and noteId from request
      const { taskId, noteId } = request.body;

      // Convert taskId and noteId to ObjectId
      const taskObjectId = new mongoose.Types.ObjectId(taskId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      // Find the task to extract file keys
      const task = await MongoService.findOne(
        MONGO_DB_EXEM,
        this.task,
        {
          query: { _id: taskObjectId, 'notes._id': noteObjectId }
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

      // Perform the update operation to delete the note
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.task,
        {
          query: { _id: taskObjectId, 'notes._id': noteObjectId },
          updateData: { $pull: { notes: { _id: noteObjectId } } },
          updateOptions: { new: true }
        }
      );

      // Handle case where no document was updated
      if (!result || result.matchedCount === 0) {
        return response.status(404).json({ message: 'Task not found or note not found' });
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


      let queryCondition: any = { companyName: companyName, status: "complete" };

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


      let queryCondition: any = { companyName: companyName, status: { $ne: "complete" } };

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

  public taskAllActivity = async (
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

      const result = await MongoService.find(MONGO_DB_EXEM, this.task, {
        query: {}

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
