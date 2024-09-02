
import { links } from './links.interface'

import mongoose, { Schema, Document } from 'mongoose';


const linkSchema: Schema = new mongoose.Schema({
    companyName: { type: String ,require:true },
    companyLink: { type: String }, // Assuming this is the primary link
    facebook: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    skype: { type: String, default: '' },
    others: { type: String, default: '' },
    priority: { type: String, default: '' },
    reference: { type: String, default: '' },


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

const linkModel = mongoose.model<links & mongoose.Document>('link', linkSchema)
export default { model: linkModel, modelSchema: linkSchema, modelName: 'link' };

