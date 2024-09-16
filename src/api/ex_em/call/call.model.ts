
import { calls } from './call.interface'

import mongoose, { Schema, Document } from 'mongoose';

const noteSchema: Schema = new mongoose.Schema({
    text: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() } // Automatically sets the current timestamp
});

const callSchema: Schema = new mongoose.Schema({
    name: { type: String, required: true },
    userAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },
    agent:{type: String, required: true},
    phoneNo:{type: String, required: true},
    company: { type: String, required: true },
    position: { type: String, required: true },
    callType: { type: String, required: true },
    callStatus: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    callDuration: { type: String, required: true }, // Duration in seconds
    subject: { type: String, required: true },
    audio:[{ type: String, default: [] }] ,// Optional field
    callPurpose: { type: String, required: true },
    callResult: { type: String, required: true },
    description: { type: String, required: false },
    notes: [noteSchema]



},
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            getters: true
        }
    })

const callModel = mongoose.model<calls & mongoose.Document>('call', callSchema)
export default { model: callModel, modelSchema: callSchema, modelName: 'call' };

