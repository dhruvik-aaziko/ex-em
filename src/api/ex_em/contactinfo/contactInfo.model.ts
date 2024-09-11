
import { contactInfo } from './contactInfo.interface'

import mongoose, { Schema, Document } from 'mongoose';


const contaceInfoSchema: Schema = new mongoose.Schema({
    companyName: { type: String },
    personName: { type: String },
    phone: { type: String },
    email: { type: String },
    position: { type: String },
    notes: { type: String },
    

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

