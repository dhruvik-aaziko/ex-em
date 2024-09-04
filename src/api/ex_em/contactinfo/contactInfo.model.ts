
import { contactInfo } from './contactInfo.interface'

import mongoose, { Schema, Document } from 'mongoose';

const noteSchema: Schema = new mongoose.Schema({
    text: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() } // Automatically sets the current timestamp
});
const contaceInfoSchema: Schema = new mongoose.Schema({
    companyName: { type: String },
    personName: { type: String },
    phone: { type: String },
    email: { type: String },
    position: { type: String },
    notes: [noteSchema]
    

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

const contaceInfoModel = mongoose.model<contactInfo & mongoose.Document>('contaceInfo', contaceInfoSchema)
export default { model: contaceInfoModel, modelSchema: contaceInfoSchema, modelName: 'contaceInfo' };

