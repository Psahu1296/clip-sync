import { Request } from 'express';
import { User } from './index';

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
