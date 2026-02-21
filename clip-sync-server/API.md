# API Reference

Base URL: `https://your-server.onrender.com/api/v1`

## Authentication

All protected endpoints require a Bearer token from Supabase Auth:

```
Authorization: Bearer <jwt-token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `PAYMENT_REQUIRED` | 402 | Feature requires paid plan |
| `DEVICE_LIMIT_EXCEEDED` | 402 | Free plan device limit reached |
| `CONTENT_TYPE_NOT_ALLOWED` | 402 | Content type not allowed on current plan |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## User Endpoints

### Get Current User

Get the authenticated user's profile.

**Endpoint:** `GET /user/me`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "plan": "free",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### Get Subscription Info

Get detailed subscription information including device count and plan limits.

**Endpoint:** `GET /user/subscription`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "free",
    "deviceCount": 1,
    "maxDevices": 1,
    "canSyncImages": false,
    "canSyncToCloud": false
  }
}
```

---

## Device Endpoints

### Register Device

Register a new device or update existing device's last sync time.

**Endpoint:** `POST /device/register`

**Auth:** Required

**Request Body:**
```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceName": "iPhone 14 Pro"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "name": "iPhone 14 Pro",
    "lastSyncAt": "2026-01-10T06:18:22.000Z",
    "createdAt": "2026-01-10T06:18:22.000Z"
  }
}
```

**Errors:**
- `402 DEVICE_LIMIT_EXCEEDED` - Free plan allows only 1 device

### Remove Device

Remove a device from the user's account.

**Endpoint:** `POST /device/remove`

**Auth:** Required

**Request Body:**
```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Device removed successfully"
  }
}
```

### List Devices

Get all devices registered to the user.

**Endpoint:** `GET /device/list`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "device-uuid-1",
        "userId": "user-uuid",
        "name": "iPhone 14 Pro",
        "lastSyncAt": "2026-01-10T06:18:22.000Z",
        "createdAt": "2026-01-09T10:00:00.000Z"
      },
      {
        "id": "device-uuid-2",
        "userId": "user-uuid",
        "name": "MacBook Pro",
        "lastSyncAt": "2026-01-10T05:30:00.000Z",
        "createdAt": "2026-01-08T14:20:00.000Z"
      }
    ]
  }
}
```

---

## Sync Endpoints

### Push Clips

Upload encrypted clips to the server.

**Endpoint:** `POST /sync/push`

**Auth:** Required

**Rate Limit:** 30 requests per minute

**Request Body:**
```json
{
  "clips": [
    {
      "id": "clip-uuid-1",
      "deviceId": "device-uuid",
      "encryptedBlob": "base64-encrypted-data-here",
      "contentType": "text",
      "createdAt": "2026-01-10T06:18:22.000Z",
      "updatedAt": "2026-01-10T06:18:22.000Z"
    },
    {
      "id": "clip-uuid-2",
      "deviceId": "device-uuid",
      "encryptedBlob": "base64-encrypted-data-here",
      "contentType": "url",
      "createdAt": "2026-01-10T06:19:00.000Z",
      "updatedAt": "2026-01-10T06:19:00.000Z"
    }
  ]
}
```

**Field Descriptions:**
- `id` (UUID): Client-generated unique identifier for the clip
- `deviceId` (UUID): Device that created this clip
- `encryptedBlob` (string): Base64-encoded encrypted clip data
- `contentType` (enum): One of `text`, `url`, or `image`
- `createdAt` (ISO 8601): When clip was created on client
- `updatedAt` (ISO 8601): When clip was last modified on client

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 2,
    "serverTimestamp": "2026-01-10T06:19:05.000Z"
  }
}
```

**Errors:**
- `402 CONTENT_TYPE_NOT_ALLOWED` - Free users cannot sync images
- `403 FORBIDDEN` - Device doesn't belong to user
- `400 VALIDATION_ERROR` - Invalid clip data

**Notes:**
- Maximum 100 clips per request
- Server performs upsert (insert or update)
- Device's `lastSyncAt` is automatically updated

### Pull Clips

Retrieve clips from the server, optionally since a specific timestamp.

**Endpoint:** `GET /sync/pull?lastSync=<timestamp>`

**Auth:** Required

**Rate Limit:** 30 requests per minute

**Query Parameters:**
- `lastSync` (optional): ISO 8601 timestamp. Only returns clips updated after this time.

**Example:**
```
GET /sync/pull?lastSync=2026-01-10T06:00:00.000Z
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clips": [
      {
        "id": "clip-uuid-1",
        "userId": "user-uuid",
        "deviceId": "device-uuid",
        "encryptedBlob": "base64-encrypted-data",
        "contentType": "text",
        "createdAt": "2026-01-10T06:18:22.000Z",
        "updatedAt": "2026-01-10T06:18:22.000Z",
        "deleted": false
      }
    ],
    "serverTimestamp": "2026-01-10T06:20:00.000Z"
  }
}
```

**Notes:**
- Returns up to 1000 most recent clips
- Includes deleted clips (check `deleted` field)
- Use `serverTimestamp` for next pull request

---

## Clip Endpoints

### Delete Clip

Soft delete a clip (marks as deleted, doesn't remove from database).

**Endpoint:** `POST /clip/delete`

**Auth:** Required

**Request Body:**
```json
{
  "clipId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Clip deleted successfully"
  }
}
```

### Restore Clip

Restore a previously deleted clip.

**Endpoint:** `POST /clip/restore`

**Auth:** Required

**Request Body:**
```json
{
  "clipId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Clip restored successfully"
  }
}
```

---

## Billing Endpoints

### Verify In-App Purchase

Verify a Google Play Store or Apple App Store purchase. This should be called by the mobile app after a successful purchase via the `billing_client` (Android) or `StoreKit` (iOS).

**Endpoint:** `POST /billing/iap/verify`

**Auth:** Required

**Request Body:**
```json
{
  "platform": "android",
  "purchaseToken": "google-play-purchase-token",
  "productId": "com.yourapp.pro.monthly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

**Note:** Integrating with RevenueCat is recommended for robust receipt validation.

### RevenueCat Webhook

Webhook endpoint for RevenueCat events. Configure this URL in the RevenueCat dashboard.

**Endpoint:** `POST /billing/webhook/revenuecat`

**Auth:** Public (Signature verification recommended)

**Events Handled:**
- `INITIAL_PURCHASE` - Upgrades user to Pro
- `RENEWAL` - Maintains Pro status
- `CANCELLATION` - Downgrades to Free
- `EXPIRATION` - Downgrades to Free

**Response:**
```json
{
  "received": true
}
```

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| General API | 100 requests per 15 minutes |
| Sync endpoints | 30 requests per minute |
| Auth endpoints | 5 requests per 15 minutes |

When rate limit is exceeded, you'll receive:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

---

## Client Implementation Guide

### Initial Setup

1. Authenticate user with Supabase
2. Get JWT token from Supabase
3. Register device with server
4. Perform initial sync pull

### Sync Flow

**On clipboard change (client-side):**
1. Encrypt clip data with user's key
2. Store locally
3. Queue for sync

**Periodic sync (every 30 seconds or on app foreground):**
1. Push local changes: `POST /sync/push`
2. Pull server changes: `GET /sync/pull?lastSync=<last-timestamp>`
3. Merge changes locally (client handles conflicts)
4. Update UI

### Encryption Best Practices

- Generate encryption key from user's password/passphrase
- Never send encryption key to server
- Encrypt all clip data before sending to server
- Server only stores encrypted blobs
- Decrypt on client after pulling from server

### Error Handling

```typescript
try {
  const response = await fetch('/api/v1/sync/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ clips })
  });

  const data = await response.json();

  if (!data.success) {
    if (data.error.code === 'PAYMENT_REQUIRED') {
      // Show upgrade prompt
    } else if (data.error.code === 'UNAUTHORIZED') {
      // Refresh token or re-authenticate
    }
  }
} catch (error) {
  // Handle network errors
}
```

---

## Postman Collection

Import this collection to test the API:

```json
{
  "info": {
    "name": "Clip Sync API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://your-server.onrender.com/api/v1"
    },
    {
      "key": "token",
      "value": "your-jwt-token"
    }
  ]
}
```

Add this to your Postman environment and replace `baseUrl` and `token` with your values.
