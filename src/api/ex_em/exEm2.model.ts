
import { timeStamp } from 'console';
import { exEm } from './exEm.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongoose, { Schema, Document } from 'mongoose';


const exEm2Schema: Schema = new mongoose.Schema({
    date: { type:Schema.Types.Mixed, },
    shipmentId: { type:Schema.Types.Mixed },
    hsCode: {type:Schema.Types.Mixed, },
    hsCode_1: { type:Schema.Types.Mixed, },
    industry: { type:Schema.Types.Mixed, },
    product: { type:Schema.Types.Mixed, },
    bCountry: {type:Schema.Types.Mixed, },
    buyer: {type:Schema.Types.Mixed, },
   // company: {type:Schema.Types.Mixed, },
    dPort: {type:Schema.Types.Mixed, },
    sCountry: {type:Schema.Types.Mixed, },
    seller: {type:Schema.Types.Mixed, },
    sPort: {type:Schema.Types.Mixed, },
    portCode: {type:Schema.Types.Mixed, },
    unit: {type:Schema.Types.Mixed, },
    qty: { type:Schema.Types.Mixed, },
    value: { type:Schema.Types.Mixed, },
    pricePerUnit: { type:Schema.Types.Mixed, },
    notes: { type:Schema.Types.Mixed,default:" " },
    contactInfo: { type:Schema.Types.Mixed,default:" " },

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
    exEm2Schema.plugin(mongoosePaginate);
const exEmTry = mongoose.model<exEm & mongoose.Document>('exEmTry', exEm2Schema)
export default { model: exEmTry, modelSchema: exEm2Schema, modelName: 'exEmTry' };

