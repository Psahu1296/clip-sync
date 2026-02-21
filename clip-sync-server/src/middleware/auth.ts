import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest } from '../types/express';
import { AppError, ErrorCodes } from '../utils/errors';
import { logger } from '../utils/logger';
import { db } from '../db';

interface SupabaseJWTPayload {
  sub: string; // user id
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // Verify JWT with Supabase secret
    const decoded = jwt.verify(token, config.supabase.jwtSecret) as SupabaseJWTPayload;

    if (!decoded.sub) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token payload');
    }

    // Attach user ID to request
    req.userId = decoded.sub;

    // Optionally fetch user from database to ensure they exist
    const result = await db.query('SELECT id, plan, created_at FROM users WHERE id = $1', [
      decoded.sub,
    ]);

    if (result.rows.length === 0) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'User not found');
    }

    req.user = {
      id: result.rows[0].id,
      plan: result.rows[0].plan,
      createdAt: result.rows[0].created_at,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT verification failed', { error: error.message });
      next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired token'));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Authentication error', { error });
      next(new AppError(500, ErrorCodes.INTERNAL_ERROR, 'Authentication failed'));
    }
  }
}

/**
 * Attempt to authenticate the token but allow the request to continue if it fails.
 * Useful for public endpoints that can be enhanced by knowing the user.
 */
export async function tryAuthenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.supabase.jwtSecret) as SupabaseJWTPayload;

    if (decoded.sub) {
      req.userId = decoded.sub;
      const result = await db.query('SELECT id, plan, created_at FROM users WHERE id = $1', [
        decoded.sub,
      ]);

      if (result.rows.length > 0) {
        req.user = {
          id: result.rows[0].id,
          plan: result.rows[0].plan,
          createdAt: result.rows[0].created_at,
        };
      }
    }
  } catch (error) {
    // Silently ignore auth errors for "soft" authentication
    logger.debug('Soft auth failed', { error: (error as Error).message });
  } finally {
    next();
  }
}
