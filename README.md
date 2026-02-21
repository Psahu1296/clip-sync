# Clip Sync

A full-stack clipboard synchronization app with end-to-end encryption, multi-device support, and cloud backup.

## Project Structure

```
clip-sync/
├── clip-app/            # Mobile app (React Native + Expo)
└── clip-sync-server/    # Backend API (Node.js + Express)
```

## Features

- **Clipboard Monitoring** — Automatically captures copied text, URLs, and code snippets
- **End-to-End Encryption** — All clip data is encrypted on-device before syncing; the server never sees plaintext
- **Multi-Device Sync** — Push and pull clips across all registered devices
- **Pin & Favorites** — Pin important clips so they're never auto-deleted
- **Soft Delete & Restore** — Recover accidentally deleted clips
- **Background Monitoring (Android)** — Accessibility Service with floating overlay for clipboard capture in background
- **Free & Pro Plans** — Tiered access with Stripe and RevenueCat billing

## Tech Stack

### Mobile App (`clip-app/`)

| Layer | Technology |
|-------|------------|
| Framework | React Native (Expo 54+) |
| Routing | Expo Router (file-based) |
| Language | TypeScript |
| State | React Context + TanStack Query |
| Storage | AsyncStorage |
| HTTP | Axios |
| Encryption | expo-crypto |
| Native Module | Kotlin (Android clipboard accessibility) |

### Server (`clip-sync-server/`)

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth + JWT |
| Validation | Zod |
| Payments | Stripe, RevenueCat |
| Security | Helmet, CORS, Rate Limiting, RLS |
| Logging | Winston |

## API Endpoints

```
GET    /health                    Health check

# User
GET    /user/me                   Current user profile
GET    /user/subscription         Subscription info

# Device
POST   /device/register           Register device
POST   /device/remove             Remove device
GET    /device/list               List devices

# Sync
POST   /sync/push                 Push encrypted clips
GET    /sync/pull                 Pull clips since last sync

# Clips
POST   /clip/delete               Soft delete clip
POST   /clip/restore              Restore clip

# Billing
POST   /billing/checkout          Create Stripe checkout
POST   /billing/iap/verify        Verify in-app purchase
POST   /billing/webhook/stripe    Stripe webhook
POST   /billing/webhook/revenuecat RevenueCat webhook
```

## Plans

| | Free | Pro |
|---|---|---|
| Clip Limit | 30 | 200 |
| Content Types | Text, URL | Text, URL, Image |
| Cloud Sync | No | Yes |
| Devices | 1 | Unlimited |

## Getting Started

### Server

```bash
cd clip-sync-server
cp .env.example .env   # Configure environment variables
npm install
npm run migrate         # Run database migrations
npm run dev             # Start dev server
```

### App

```bash
cd clip-app
npm install
npm start               # Start Expo dev server
```

### Environment Variables (Server)

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
ALLOWED_ORIGINS=
PORT=3000
```

## Database Schema

```
users       — id, plan (free|pro|enterprise), timestamps
devices     — id, user_id, name, last_sync_at, timestamps
clips       — id, user_id, device_id, encrypted_blob, content_type, deleted, synced_at, timestamps
```

## Deployment

- **Server** — Render.com (auto-deploy from Git)
- **Database** — Supabase (PostgreSQL with RLS)
- **App** — EAS Build (TestFlight / Google Play)
