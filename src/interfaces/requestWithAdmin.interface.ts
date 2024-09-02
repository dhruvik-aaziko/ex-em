import { Request } from 'express';
import { Admin } from '../api/admin/admin.interface';


export interface RequestWithAdmin extends Request{
  user:Admin
}