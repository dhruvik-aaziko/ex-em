
import { timeStamp } from 'console';
import { exEm } from './exEm.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { Schema, Document } from 'mongoose';


const exEmSchema: Schema = new mongoose.Schema({
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
    sheetName: { type:Schema.Types.Mixed,default:" " },

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
    exEmSchema.plugin(aggregatePaginate);
    exEmSchema.plugin(mongoosePaginate);

const exEmModel = mongoose.model<exEm & mongoose.Document>('exEm', exEmSchema)
export default { model: exEmModel, modelSchema: exEmSchema, modelName: 'exEm' };

