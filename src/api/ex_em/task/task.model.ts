











import { EMPTY } from '../../../constants';
import { tasks } from './task.interface'

import mongoose, { Schema, Document } from 'mongoose';


const taskSchema: Schema = new mongoose.Schema({

    userAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },

    taskOwner: { type: String, require: true },
    companyName: { type: String, require: true }, // Assuming this is the primary task
    subject: { type: String, require: true },
    dueDate: { type: Date, require: true },
    relatedTo: { type: String, require: true },
    status: { type: String, require: true },
    assign: { type: String, require: true },
    repeat: { type: String, require: true },
    priority: { type: String, require: true },
    reminder: { type: Date, require: true },
    notes: [{
        text: { type: String, default: "" },
        video: [{ type: String, default: [] }],
        photo: [{ type: String, default: [] }],
        audio: [{ type: String, default: [] }],
        documents: [{ type: String, default: [] }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }]


    // emptyField: {type:Schema.Types.Mixed, default: '-' } // Handling "__EMPTY" field
},
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            getters: true
        }
    })

const taskModel = mongoose.model<tasks & mongoose.Document>('task', taskSchema)
export default { model: taskModel, modelSchema: taskSchema, modelName: 'task' };

