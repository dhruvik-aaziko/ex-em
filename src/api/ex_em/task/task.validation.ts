import { body } from 'express-validator';
import validate from '../../../middleware/validate.middleware';
import { ERROR_MESSAGES } from '../../../constants';

class taskValidation {

    createTaskValidation = () =>
        validate([
            body('taskOwner')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'taskOwner'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'taskOwner')),
            body('companyName')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'companyName'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'companyName')),
            body('subject')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'subject'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'subject')),
            body('dueDate')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'dueDate'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'dueDate')),
            body('relatedTo')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'relatedTo'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'relatedTo')),
            body('status')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'status'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'status')),
            body('assign')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'assign'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'assign')),
            body('repeat')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'repeat'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'repeat')),
            body('priority')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'priority'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'priority')),
            body('reminder')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'reminder'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'reminder')),

        ]);

    updateTaskValidation = () =>
        validate([

            body('subject')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'subject'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'subject')),
            body('dueDate')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'dueDate'))
                .isDate()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'dueDate')),
            body('relatedTo')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'relatedTo'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'relatedTo')),
            body('status')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'status'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'status')),
            body('assign')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'assign'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'assign')),
            body('repeat')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'repeat'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'repeat')),
            body('priority')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'priority'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'priority')),
            body('reminder')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'reminder'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'reminder')),

        ]);

    getTaskValidation = () =>
        validate([
            body('companyName')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'companyName'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'companyName')),
        ])


    addNoteToTaskValidation = () =>
        validate([
            body('text')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'companyName'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'companyName')),
        ])

    updateNoteValidation = () =>
        validate([
            body('text')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'text'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'text')),
            body('taskId')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'taskId'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'taskId')),
            body('noteId')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'noteId'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'noteId')),
        ])

        deleteNoteValidation = () =>
        validate([
            body('taskId')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'taskId'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'taskId')),
            body('noteId')
                .notEmpty()
                .withMessage(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'noteId'))
                .isString()
                .withMessage(ERROR_MESSAGES.COMMON.STRING.replace(':attribute', 'noteId'))
          
        ])
}

export default taskValidation;
