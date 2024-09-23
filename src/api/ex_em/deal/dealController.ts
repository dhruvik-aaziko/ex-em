import { Router, Request, Response, NextFunction, query } from 'express';
import { ERROR_MESSAGES, NUMERICAL, ROUTES, STATUS_CODE, SUCCESS_MESSAGES, EMPTY, COMMON_CONSTANT } from "../../../constants";
import getconfig from '../../../config';
import { successMiddleware } from '../../../middleware/response.middleware';
import logger from '../../../logger';
import { MongoService } from '../../../utils/mongoService';
import DealValidation from './deal.validation';
import authMiddleware from '../../../middleware/auth.middleware';
import { RequestWithAdmin } from '../../../interfaces/requestWithAdmin.interface';
import mongoose, { Query } from 'mongoose';
import uploadHandler from '../../../utils/multer';
import { validateFile } from '../../../utils/validationFunctions';
import { audioFileUploadHandle, fileUploadHandle, pdfFileUploadHandle, videoFileUploadHandle } from '../../../utils/fileUploadHandle';
import adminModel from '../../admin/admin.model';
import dealModel from './deal.model';


const { MONGO_DB_EXEM } = getconfig();

class DealController {
  public path = `/${ROUTES.DEAL}`;
  private validation = new DealValidation();
  public router = Router();
  public Deal = dealModel;
  public Admin = adminModel

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {

    this.router.post(
      `${this.path}/createDeal`,
      authMiddleware,
      uploadHandler.fields([

        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
        { name: "document", maxCount: 1 }

      ]),
      this.createDeal);

    this.router.post(
      `${this.path}/getDeals/:id`,
      authMiddleware,
      this.getDeals);

    this.router.put(
      `${this.path}/updateDeal/:id`,
      authMiddleware,
      // this.validation.updateDealValidation(),
      this.updateDeal);

    this.router.delete(
      `${this.path}/deleteDeal/:id`,

      authMiddleware,
      this.deleteDeal);

    //====Routes for notes within Deals=====================================================================================
    this.router.post(
      `${this.path}/addnote/:id`,
      authMiddleware,
      uploadHandler.fields([

        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
        { name: "document", maxCount: 1 }

      ]),
      this.addNoteToDeal); // Add a new note

    this.router.post(
      `${this.path}/updatenote`,
      authMiddleware,
    //  this.validation.updateNoteValidation(),
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
      `${this.path}/DealOpenActivity`,
      authMiddleware,

      this.DealOpenActivity);

    this.router.post(
      `${this.path}/DealCompleteActivity`,
      authMiddleware,

      this.DealCompleteActivity);

  }


  public createDeal = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      const {
        dealOwner, dealName, accountName, type, nextStep, leadSource, contactName, amount, closingDate,
        stage, probability, expectedRevenue, campaignSource, assignedTo

      } = request.body;

      //const notes = JSON.parse(request.body.notes);
      //const text2 = notes.text;



      let deal = await MongoService.findOne(MONGO_DB_EXEM, this.Deal, {
        query: {
          dealOwner: dealOwner,
          dealName: dealName,
          accountName: accountName,
          type: type,
          nextStep: nextStep,
          leadSource: leadSource,
          amount: amount,
          contactName: contactName,
          closingDate: closingDate,
          stage: stage,
          probability: probability,
          expectedRevenue: expectedRevenue,
          campaignSource: campaignSource,
          assignedTo: assignedTo,

        }
      })

      if (deal) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.ALREADY_EXISTS.replace(':attribute', 'deal'));
      }

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      const files: any = request?.files;
      // console.log(files);

      const fileImageDeals = [{ type: 'image', fileArray: ['image'] }];
      const fileVideoDeals = [{ type: 'video', fileArray: ['video'] }];
      const fileAudioDeals = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentDeals = [{ type: 'document', fileArray: ['document'] }];

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

      const { imagePictures } = await fileUploadHandle(files, fileImageDeals, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideoDeals, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudioDeals, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentDeals, false);


      console.log(req.body)
      const addDeal = await MongoService.create(MONGO_DB_EXEM, this.Deal, {
        insert: {
          userAdminId:currentUserId,
          dealOwner: dealOwner,
          dealName: dealName,
          accountName: accountName,
          type: type,
          nextStep: nextStep,
          leadSource: leadSource,
          amount: amount,
          contactName: contactName,
          closingDate: closingDate,
          stage: stage,
          probability: probability,
          expectedRevenue: expectedRevenue,
          campaignSource: campaignSource,
          assignedTo: assignedTo,
          notes: {
            // text: request.body.notes.text,
            text:"text2",
            photo: imagePictures,
            video: videoData,
            audio: audioData,
            documents: documentData

          },
        }
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', `deal`),
          data: addDeal
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error creating deal: ${error}`);
      next(error);
    }
  };

  

  public getDeals = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {

      const { id } = request.params;

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      const result = await MongoService.find(MONGO_DB_EXEM, this.Deal, {
        query: { _id: id }
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `deal`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error fetching Deals: ${error}`);
      next(error);
    }
  };

  public updateDeal = async (
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
        this.Deal,
        {
          query: { _id: id },
          updateData: { $set: updateData },
          updateOptions: { new: true }
        }
      );

      if (!result) {
        return response.status(404).json({ message: 'deal not found' });
      }

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.UPDATE_SUCCESS.replace(':attribute', `deal`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error updating deal: ${error}`);
      next(error);
    }
  };

  public deleteDeal = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = request.params;
      const result = await MongoService.deleteOne(MONGO_DB_EXEM, this.Deal, {
        query: { _id: id }
      });

      if (!result.deletedCount) {
        return response.status(404).json({ message: 'deal not found' });
      }

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.DELETE_SUCCESS.replace(':attribute', `deal`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error deleting deal: ${error}`);
      next(error);
    }
  };

  //====================================================================================================================


  public addNoteToDeal = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { text } = request.body;
      const files: any = request?.files;

      const req = request as RequestWithAdmin;
      const currentUserId = req.user._id;

      let deal = await MongoService.findOne(MONGO_DB_EXEM, this.Deal, {
        query: {
          _id: request.params.id,
          // userAdminId: currentUserId
        }
      })
      if (!deal) {
        response.statusCode = STATUS_CODE.BAD_REQUEST;
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'deal'));
      }

      const fileImageDeals = [{ type: 'image', fileArray: ['image'] }];
      const fileVideoDeals = [{ type: 'video', fileArray: ['video'] }];
      const fileAudioDeals = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentDeals = [{ type: 'document', fileArray: ['document'] }];

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

      const { imagePictures } = await fileUploadHandle(files, fileImageDeals, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideoDeals, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudioDeals, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentDeals, false);


      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Deal,
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
      const { text, dealId, noteId } = request.body;
      const files: any = request?.files;


      // Convert IDs to ObjectId  
      const DealObjectId = new mongoose.Types.ObjectId(dealId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      // Validate the existence of the deal
      let deal = await MongoService.findOne(MONGO_DB_EXEM, this.Deal, {
        query: { _id: DealObjectId }
      });
      if (!deal) {
        return response.status(404).json({ message: ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'deal') });
      }

      // Validate and handle files
      const fileImageDeals = [{ type: 'image', fileArray: ['image'] }];
      const fileVideoDeals = [{ type: 'video', fileArray: ['video'] }];
      const fileAudioDeals = [{ type: 'audio', fileArray: ['audio'] }];
      const fileDocumentDeals = [{ type: 'document', fileArray: ['document'] }];

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
      const { imagePictures } = await fileUploadHandle(files, fileImageDeals, false);
      const { videoData } = await videoFileUploadHandle(files, fileVideoDeals, false);
      const { audioData } = await audioFileUploadHandle(files, fileAudioDeals, false);
      const { documentData } = await pdfFileUploadHandle(files, fileDocumentDeals, false);



      // Update the specific note in the notes array
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Deal,
        {
          query: {
            _id: DealObjectId,
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
        return response.status(404).json({ message: 'deal or note not found' });
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
      const { dealId, noteId } = request.body;



      // Convert `callId` and `noteId` to ObjectId
      const DealObjectId = new mongoose.Types.ObjectId(dealId);
      const noteObjectId = new mongoose.Types.ObjectId(noteId);

      // Perform the update operation
      const result = await MongoService.findOneAndUpdate(
        MONGO_DB_EXEM,
        this.Deal,
        {
          query: { _id: DealObjectId, 'notes._id': noteObjectId },
          updateData: { $pull: { notes: { _id: noteObjectId } } },
          updateOptions: { new: true }
        }
      );

      // Handle case where no document was found
      if (!result || result.matchedCount === 0) {
        return response.status(404).json({ message: 'deal not found or note not found' });
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
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `deal`),
          data: result
        },
        request,
        response,
        next
      );
    } catch (error) {
      logger.error(`Error fetching Deals: ${error}`);
      next(error);
    }
  };


  //========================================== =================== 

  public DealCompleteActivity = async (
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

      const result = await MongoService.find(MONGO_DB_EXEM, this.Deal, {
        query: queryCondition,
        // Fetch the Deals based on the determined query condition
        // select: 'subject dueDate DealOwner assign status'
      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `deal`),
          data: result
        },
        request,
        response,
        next

      );
    } catch (error) {
      logger.error(`Error fetching Deals: ${error}`);
      next(error);
    }
  };



  public DealOpenActivity = async (
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

      // Fetch the Deals based on the determined query condition
      const result = await MongoService.find(MONGO_DB_EXEM, this.Deal, {

        query: queryCondition

      });

      successMiddleware(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', `deal`),
          data: result
        },
        request,
        response,
        next
      );

    } catch (error) {
      logger.error(`Error fetching Deals: ${error}`);
      next(error);
    }
  };


}

export default DealController;
