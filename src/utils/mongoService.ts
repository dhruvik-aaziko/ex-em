import mongoose from 'mongoose';
import MongoBot from '../connections/mongo';
import { COMMON_CONSTANT } from '../constants';
// import { getConnectionModel } from '../api/user/user.model';

const ObjectId = (id: string) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    return false;
  }
};

interface UpdateData {
  updateData?: unknown;
  updateOptions?: unknown;
}

interface Paginate {
  query?: unknown;
  select?: string;
  sort?: any;
  populate?: any;
  offset?: number;
  limit?: number;
}

interface SortObject {
  _id?: number;
}

interface Options extends UpdateData {
  query?: unknown;
  select?: string;
  sort?: any;
  populate?: any;
  offset?: number;
  limit?: number;
  lean?: boolean;
  insert?: unknown;
  deletedBy?: string;
}

interface Result {
  docs: unknown;
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  nextPage: string;
  hasPrevPage: boolean;
  prevPage: string;
  pagingCounter: number;
}

const find = async (connectionName: string, collections: any, options?: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model
    .find(options?.query || {})
    .select(options?.select)
    .populate(options?.populate)
    .sort(options?.sort)
    
}

const findById = async (connectionName: string, collections: any, options?: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model
    .findById(options?.query || {})
    .select(options?.select)
    .populate(options?.populate)
    .lean(options?.lean || true);
}

const findOne = async (connectionName: string, collections: any, options?: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model
    .findOne(options?.query || {})
    .select(options?.select)
    .populate(options?.populate)
    .sort(options?.sort)
    .lean(options?.lean ?? true);
}

const create = async (connectionName: string, collections: any, options?: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.create(options?.insert);
}

const insertMany = async (connectionName: string, collections: any, options?: Options) => {
  // Retrieve the model based on the connection name and collections schema
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.insertMany(options?.insert);
}

const countDocuments = async (connectionName: string, collections: any, options: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.countDocuments(options.query || {}).exec();
}

// const softDeleteOne = async (connectionName: string, collections: any, options: Options) => {
//   const connection = MongoBot.getConnection(connectionName);
//   const model = connection.model(collections);
//   const doc = await findOne(collections, options);
//   doc.deletedBy = options.deletedBy;
//   doc.deleted = true;
//   return doc.save();
// };

const deleteOne = async (connectionName: string, collections: any, options: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.deleteOne(options.query || {}).exec();
}

const findOneAndUpdate = async (connectionName: string, collections: any,  options: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.findOneAndUpdate(
    options.query || {},
    options.updateData || {},
    options.updateOptions || { new: true }
  );
}

const deleteMany = async (connectionName: string, collections: any, options: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.deleteMany(options.query || {});
}

const findByIdAndDelete = async (connectionName: string, collections: any, options: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.findByIdAndDelete(options.query);
}

const aggregate = async (connectionName: string, collections: any, aggregateQuery: any) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.aggregate(aggregateQuery);
}

const updateMany = async (connectionName: string, collections: any, options: Options) => {
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.updateMany(
    options.query || {},
    options.updateData || {},
    options.updateOptions || { new: true }
  )
}

const getModel = (connectionName: any, modelName: string, schema: any) => {
  const connection = MongoBot.getConnection(connectionName);
  if (connection.models[modelName]) {
    return connection.models[modelName];
  }
  return connection.model(modelName, schema);
};

const pagination = async (
  connectionName: string,
  collections: any,
  paginate: Paginate = {}
): Promise<Result> => {

  let options: any = {
    select: paginate?.select || '',
    sort: paginate?.sort || { createdAt: -1 },
    populate: paginate?.populate || '',
    lean: true,
    offset: paginate?.offset || 0,
    // limit: paginate?.limit || COMMON_CONSTANT.PAGINATION_LIMIT
  };

  if (paginate && paginate.limit) {
    options = {
      ...options,
      limit: paginate.limit
    }
  } else {
    options = {
      ...options,
      pagination: false
    }
  }
  const model: any = getModel(connectionName, collections.modelName, collections.modelSchema);
  return model.paginate(paginate?.query || {}, options);
};

const aggregatePaginate = async (connectionName: string, collections: any, paginate?: Paginate) => {
  const options = {
    page: paginate?.offset || 1,
    limit: paginate?.limit || COMMON_CONSTANT.PAGINATION_LIMIT
  };

  const model: any = getModel(connectionName, collections.modelName, collections.modelSchema);

  const aggregate = model.aggregate(paginate?.query);
  return model.aggregatePaginate(aggregate, options);
};

const bulkWrite = async (connectionName: string, collections: any, operations: any[], options: any = {}) => {
  // Retrieve the model based on the connection name and collections schema
  const model = getModel(connectionName, collections.modelName, collections.modelSchema);
  
  // Execute the bulkWrite operation on the model
  return model.bulkWrite(operations, options);
};




const exportObject = {
  ObjectId,
  find,
  findById,
  findOne,
  create,
  countDocuments,
  // softDeleteOne,
  deleteOne,
  findOneAndUpdate,
  deleteMany,
  findByIdAndDelete,
  aggregate,
  updateMany,
  getModel,
  pagination,
  aggregatePaginate,
  insertMany,
  bulkWrite
};

export const MongoService = exportObject;
   