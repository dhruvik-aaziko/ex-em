import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';
import { Admin } from "./admin.interface";

const adminSchema = new mongoose.Schema({
    email: { type: String,  required: true },
    password: { type: String,  required: true },
    role: { type: String,  required: true },
    name: { type: String,  required: true },
    lastName: { type: String,  required: true },
    adminUserPermission: { type: Object , default:{}},
    isActive: { type: Boolean },
    
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        virtuals: true,
        getters: true
    }
})
adminSchema.plugin(mongoosePaginate);
const adminModel = mongoose.model<Admin & mongoose.Document>('admin', adminSchema)
export default { model: adminModel, modelSchema: adminSchema, modelName: 'admin' };



