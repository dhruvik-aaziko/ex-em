
import { tasks } from './links.interface'

import mongoose, { Schema, Document } from 'mongoose';


const taskSchema: Schema = new mongoose.Schema({
    taskOwner: { type: String, require: true },
    companyName: { type: String }, // Assuming this is the primary task
    subject: { type: String, default: '' },
    dueDate: { type: Date, default: '' },
    relatedTo: { type: String, default: '' },
    status: { type: String, default: '' },
    assign: { type: String, default: '' },
    repeat: { type: String, default: '' },
    priority: { type: String, default: '' },
    reminder: { type: Date, default: '' },
    notes:{type:Schema.Types.Mixed,}


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

