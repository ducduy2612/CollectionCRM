import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        name?: string;
        email?: string;
        roles: string[];
        permissions: string[];
        [key: string]: any;
      };
    }
  }
}