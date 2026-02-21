import { db } from '../db';
import { Clip, ClipCreateInput, ContentType } from '../types';
import { AppError, ErrorCodes } from '../utils/errors';
import { userService } from './userService';

export class ClipService {
  async getClipsByUserId(userId: string, since?: Date): Promise<Clip[]> {
    let query = `
      SELECT id, user_id, device_id, encrypted_blob, content_type, created_at, updated_at, deleted
      FROM clips
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    if (since) {
      query += ' AND updated_at > $2';
      params.push(since);
    }

    query += ' ORDER BY updated_at DESC LIMIT 1000';

    const result = await db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      deviceId: row.device_id,
      encryptedBlob: row.encrypted_blob,
      contentType: row.content_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deleted: row.deleted,
    }));
  }

  async syncPush(userId: string, clips: ClipCreateInput[]): Promise<void> {
    if (clips.length === 0) {
      return;
    }

    // Validate plan restrictions
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    }

    const planLimits = userService.getPlanLimits(user.plan);

    // Check if free user is trying to sync images
    if (!planLimits.canSyncImages) {
      const hasImages = clips.some((clip) => clip.contentType === 'image');
      if (hasImages) {
        throw new AppError(
          402,
          ErrorCodes.CONTENT_TYPE_NOT_ALLOWED,
          'Image sync is not available on free plan. Please upgrade to Pro.'
        );
      }
    }

    // Upsert clips (insert or update if exists)
    await db.transaction(async (client) => {
      for (const clip of clips) {
        await client.query(
          `
          INSERT INTO clips (id, user_id, device_id, encrypted_blob, content_type, created_at, updated_at, deleted)
          VALUES ($1, $2, $3, $4, $5, $6, $7, false)
          ON CONFLICT (id) DO UPDATE SET
            encrypted_blob = EXCLUDED.encrypted_blob,
            content_type = EXCLUDED.content_type,
            updated_at = EXCLUDED.updated_at,
            deleted = EXCLUDED.deleted
          `,
          [
            clip.id,
            userId,
            clip.deviceId,
            clip.encryptedBlob,
            clip.contentType,
            clip.createdAt,
            clip.updatedAt,
          ]
        );
      }
    });
  }

  async deleteClip(clipId: string, userId: string): Promise<void> {
    const result = await db.query(
      'UPDATE clips SET deleted = true, updated_at = NOW() WHERE id = $1 AND user_id = $2',
      [clipId, userId]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Clip not found');
    }
  }

  async restoreClip(clipId: string, userId: string): Promise<void> {
    const result = await db.query(
      'UPDATE clips SET deleted = false, updated_at = NOW() WHERE id = $1 AND user_id = $2',
      [clipId, userId]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Clip not found');
    }
  }

  async hardDeleteOldClips(daysOld: number = 90): Promise<number> {
    const result = await db.query(
      'DELETE FROM clips WHERE deleted = true AND updated_at < NOW() - INTERVAL $1 day',
      [daysOld]
    );

    return result.rowCount || 0;
  }
}

export const clipService = new ClipService();
