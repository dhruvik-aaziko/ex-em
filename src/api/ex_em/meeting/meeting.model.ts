// meeting.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import { meeting } from './meeting.interface';



const meetingSchema: Schema = new mongoose.Schema({
    userAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },

    title: { type: String },
    companyName: { type: String },
    countryName: { type: String },
    industry: { type: String },
    personName: { type: String },
    phoneNo: { type: String },
    emailID: { type: String },
    position: { type: String },
    dateTime: { type: Date },
    host: { type: String },
    location: { type: String },
    participants: { type: String },
    status: { type: String },
    notes: [{

        text: { type: String, },
        video: [{ type: String, default: [] }],
        photo: [{ type: String, default: [] }],
        audio: [{ type: String, default: [] }],
        documents: [{ type: String, default: [] }],
        RescheduleAt: { type: Date, default: "" },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }]

}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        virtuals: true,
        getters: true
    }
});

const meetingModel = mongoose.model<meeting & Document>('Meeting', meetingSchema);

export default { model: meetingModel, modelSchema: meetingSchema, modelName: 'Meeting' };
