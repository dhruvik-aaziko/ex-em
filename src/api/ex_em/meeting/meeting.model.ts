// meeting.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import { meeting } from './meeting.interface';


const noteSchema: Schema = new mongoose.Schema({
    text: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() } // Automatically sets the current timestamp
});
const meetingSchema: Schema = new mongoose.Schema({
    title: { type: String, required: true },
    companyName: { type: String, required: true },
    countryName: { type: String },
    industry: { type: String },
    personName: { type: String },
    phoneNo: { type: String },
    emailID: { type: String },
    position: { type: String },
    dateTime: { type: Date },
    host: { type: String },
    location: { type: String },
    participants: { type: String},
    status: { type: String },
    notes: [noteSchema]
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
