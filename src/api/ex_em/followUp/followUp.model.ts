
import { followUp } from './followUp.interface'

import mongoose, { Schema, Document } from 'mongoose';



const followUpSchema: Schema = new mongoose.Schema({

    userAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },
    
    name: { type: String, required: true },
    companyName: { type: String, required: true },
    assigne: { type: String, required: true },
    position: { type: String, required: true },
    callType: { type: String, required: true },
    outgoingStatus: { type: String, required: true },
    dateTime: { type: Date, required: true },
    agent: { type: String, required: true },
    subject: { type: String, required: true },
    callResult: { type: String, required: true },
    callPurpose: { type: String, required: true },

    notes: [{
        text: { type: String, },
        video: [{ type: String, default: [] }],
        photo: [{ type: String, default: [] }],
        audio: [{ type: String, default: [] }],
        documents: [{ type: String, default: [] }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }]



},
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            getters: true
        }
    })

const followUpModel = mongoose.model<followUp & mongoose.Document>('followUp', followUpSchema)
export default { model: followUpModel, modelSchema: followUpSchema, modelName: 'followUp' };

