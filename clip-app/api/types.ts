// API Response Types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'PAYMENT_REQUIRED'
  | 'DEVICE_LIMIT_EXCEEDED'
  | 'CONTENT_TYPE_NOT_ALLOWED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

// User Types
export interface User {
  id: string;
  plan: 'free' | 'pro';
  createdAt: string;
}

export interface SubscriptionInfo {
  plan: 'free' | 'pro';
  deviceCount: number;
  maxDevices: number;
  canSyncImages: boolean;
  canSyncToCloud: boolean;
}

// Device Types
export interface Device {
  id: string;
  userId: string;
  name: string;
  lastSyncAt: string;
  createdAt: string;
}

export interface RegisterDeviceRequest {
  deviceId: string;
  deviceName: string;
}

export interface RemoveDeviceRequest {
  deviceId: string;
}

// Sync Types
export type ContentType = 'text' | 'url' | 'image';

export interface SyncClip {
  id: string;
  deviceId: string;
  encryptedBlob: string;
  contentType: ContentType;
  createdAt: string;
  updatedAt: string;
}

export interface ServerClip extends SyncClip {
  userId: string;
  deleted: boolean;
}

export interface PushClipsRequest {
  clips: SyncClip[];
}

export interface PushClipsResponse {
  synced: number;
  serverTimestamp: string;
}

export interface PullClipsResponse {
  clips: ServerClip[];
  serverTimestamp: string;
}

// Clip Operations
export interface ClipIdRequest {
  clipId: string;
}

// Billing Types
export interface VerifyPurchaseRequest {
  platform: 'android' | 'ios';
  purchaseToken: string;
  productId: string;
}

export interface VerifyPurchaseResponse {
  valid: boolean;
}

// Message Response
export interface MessageResponse {
  message: string;
}

// Auth Types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
