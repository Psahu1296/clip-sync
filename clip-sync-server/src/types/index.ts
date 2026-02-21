export type UserPlan = 'free' | 'pro' | 'enterprise';

export type ContentType = 'text' | 'url' | 'image';

export interface User {
  id: string;
  plan: UserPlan;
  createdAt: Date;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  lastSyncAt: Date;
  createdAt: Date;
}

export interface Clip {
  id: string;
  userId: string;
  deviceId: string;
  encryptedBlob: string;
  contentType: ContentType;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}

export interface ClipCreateInput {
  id: string;
  deviceId: string;
  encryptedBlob: string;
  contentType: ContentType;
  createdAt: string;
  updatedAt: string;
}

export interface SyncPushRequest {
  clips: ClipCreateInput[];
}

export interface SyncPullResponse {
  clips: Clip[];
  serverTimestamp: string;
}

export interface DeviceRegisterRequest {
  deviceId: string;
  deviceName: string;
}

export interface DeviceRemoveRequest {
  deviceId: string;
}

export interface SubscriptionInfo {
  plan: UserPlan;
  deviceCount: number;
  maxDevices: number;
  canSyncImages: boolean;
  canSyncToCloud: boolean;
}

export interface IAPVerifyRequest {
  platform: 'ios' | 'android';
  receipt?: string; // iOS
  purchaseToken?: string; // Android
  productId: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}
