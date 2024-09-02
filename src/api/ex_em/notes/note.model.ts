
import { note } from './note.interface'

import mongoose, { Schema, Document } from 'mongoose';


const noteSchema: Schema = new mongoose.Schema({
    companyName: { type: String , required: true },
    note: { type: String,  required: true  },



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

const noteModel = mongoose.model<note & mongoose.Document>('note', noteSchema)
export default { model: noteModel, modelSchema: noteSchema, modelName: 'note' };

