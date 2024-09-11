
import { uniq } from 'lodash';
import { sheet } from './sheet.interface'

import mongoose, { Schema, Document } from 'mongoose';


const sheetSchema: Schema = new mongoose.Schema({
    sheetName: { type: String , required: true ,uniq:true}



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

const sheetModel = mongoose.model<sheet & mongoose.Document>('sheet', sheetSchema)
export default { model: sheetModel, modelSchema: sheetSchema, modelName: 'sheet' };

