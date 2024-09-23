import { EMPTY } from '../../../constants';
import { deals } from './deal.interface'

import mongoose, { Schema, Document } from 'mongoose';


const dealSchema: Schema = new mongoose.Schema({

    userAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' }, //created by
    dealOwner: { type: String },
    dealName: { type: String },
    accountName: { type: String },
    type: { type: String },
    nextStep: { type: String },
    leadSource: { type: String },
    contactName: { type: String },
    amount: { type: Number },
    closingDate: { type: Date },
    stage: { type: String },
    probability: { type: Number, min: 0, max: 100 },
    expectedRevenue: { type: Number },
    campaignSource: { type: String, required: false },
    assignedTo: { type: String },
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

const dealModel = mongoose.model<deals & mongoose.Document>('deal', dealSchema)
export default { model: dealModel, modelSchema: dealSchema, modelName: 'deal' };

