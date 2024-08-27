
import { exEm } from './exEm.interface';

import mongoose, { Schema, Document } from 'mongoose';


const noteContaceInfoSchema: Schema = new mongoose.Schema({
    companyName:{type:String},
   conatctInfo:{type:String},
   notes:{type:String}

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

const noteContaceInfoModel = mongoose.model<exEm & mongoose.Document>('noteContaceInfo', noteContaceInfoSchema)
export default { model: noteContaceInfoModel, modelSchema: noteContaceInfoSchema, modelName: 'noteContaceInfo' };

