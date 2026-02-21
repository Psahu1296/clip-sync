# Clip Sync Server

A production-ready backend server for a clipboard sync application with end-to-end encryption (E2EE), multi-device support, and cloud backup.

## Features

- 🔐 **End-to-End Encryption**: All clip data is encrypted client-side; server stores only encrypted blobs
- 🔄 **Multi-Device Sync**: Seamless synchronization across unlimited devices (Pro plan)
- 👤 **Supabase Authentication**: Email, Google, and Apple sign-in support
- 💳 **Subscription Management**: Stripe and RevenueCat integration for payments
- 🚀 **Production Ready**: Built with TypeScript, Express, and PostgreSQL
- 📊 **Plan-Based Features**: Free and Pro tiers with different capabilities
- 🛡️ **Security First**: JWT validation, rate limiting, and Row Level Security (RLS)

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Stripe / RevenueCat
- **Deployment**: Render.com

## Project Structure

```
clip-sync-server/
├── src/
│   ├── billing/           # Payment integration (Stripe, RevenueCat)
│   ├── config/            # Configuration management
│   ├── controllers/       # Request handlers
│   ├── db/                # Database connection and queries
│   ├── middleware/        # Express middleware (auth, errors, rate limiting)
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic layer
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions (logger, errors)
│   ├── app.ts             # Express app setup
│   └── index.ts           # Server entry point
├── migrations/            # SQL database migrations
├── scripts/               # Utility scripts
├── .env.example           # Environment variables template
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (Supabase recommended)
- Supabase account
- (Optional) Stripe account for payments

### Installation

1. **Clone the repository**

```bash
cd clip-sync-server
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Optional (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. **Run database migrations**

```bash
npm run migrate
```

5. **Start the development server**

```bash
npm run dev
```

The server will start on `http://localhost:3000`.

## API Documentation

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

### Endpoints

#### User

- `GET /api/v1/user/me` - Get current user profile
- `GET /api/v1/user/subscription` - Get subscription info

#### Device

- `POST /api/v1/device/register` - Register a new device
- `POST /api/v1/device/remove` - Remove a device
- `GET /api/v1/device/list` - List all devices

#### Sync

- `POST /api/v1/sync/push` - Push encrypted clips to server
- `GET /api/v1/sync/pull?lastSync=<timestamp>` - Pull clips since last sync

#### Clip

- `POST /api/v1/clip/delete` - Soft delete a clip
- `POST /api/v1/clip/restore` - Restore a deleted clip

#### Billing

- `POST /api/v1/billing/checkout` - Create Stripe checkout session
- `POST /api/v1/billing/iap/verify` - Verify in-app purchase
- `POST /api/v1/billing/webhook/stripe` - Stripe webhook handler
- `POST /api/v1/billing/webhook/revenuecat` - RevenueCat webhook handler

### Request/Response Examples

#### Register Device

**Request:**
```json
POST /api/v1/device/register
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

#### Push Clips

**Request:**
```json
POST /api/v1/sync/push
{
  "clips": [
    {
      "id": "clip-uuid-1",
      "deviceId": "device-uuid",
      "encryptedBlob": "base64-encrypted-data",
      "contentType": "text",
      "createdAt": "2026-01-10T06:18:22.000Z",
      "updatedAt": "2026-01-10T06:18:22.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 1,
    "serverTimestamp": "2026-01-10T06:18:22.000Z"
  }
}
```

## Plan Features

### Free Plan
- ✅ 1 device only
- ✅ Text and URL sync (local only)
- ❌ No cloud sync
- ❌ No image support

### Pro Plan
- ✅ Unlimited devices
- ✅ Cloud sync
- ✅ Image support
- ✅ Multi-device merge

## Deployment

### Render.com

1. **Create a new Web Service** on Render.com
2. **Connect your repository**
3. **Configure build settings:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Add environment variables** from `.env.example`
5. **Deploy!**

### Environment Variables on Render

Add all required environment variables in the Render dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY` (optional)
- `STRIPE_WEBHOOK_SECRET` (optional)

### Database Setup

The project uses Supabase for PostgreSQL hosting. To set up:

1. Create a Supabase project
2. Copy the connection string from Settings > Database
3. Run migrations: `npm run migrate`
4. Enable Row Level Security policies (included in migration)

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### 2. Configure Authentication

1. Go to Authentication > Providers
2. Enable Email, Google, and Apple sign-in
3. Configure OAuth credentials for Google and Apple

### 3. Get Configuration Values

- **SUPABASE_URL**: Project Settings > API > Project URL
- **SUPABASE_ANON_KEY**: Project Settings > API > anon/public key
- **SUPABASE_SERVICE_ROLE_KEY**: Project Settings > API > service_role key
- **SUPABASE_JWT_SECRET**: Project Settings > API > JWT Secret
- **DATABASE_URL**: Project Settings > Database > Connection string

### 4. Run Migrations

```bash
npm run migrate
```

This will create the necessary tables and Row Level Security policies.

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run lint` - Lint code
- `npm run type-check` - Type check without emitting

### Adding New Migrations

1. Create a new file in `migrations/` with format: `00X_description.sql`
2. Write your SQL migration
3. Run `npm run migrate`

## Security

- **JWT Validation**: All protected routes validate Supabase JWT tokens
- **Row Level Security**: Database policies ensure users can only access their own data
- **Rate Limiting**: API and sync endpoints have rate limits
- **Encryption**: All clip data is encrypted client-side (E2EE)
- **CORS**: Configured to allow only specified origins

## Future Enhancements

### WebSocket Sync
- Real-time sync using Socket.io or Supabase Realtime
- Instant updates across devices without polling

### CRDT (Conflict-Free Replicated Data Types)
- Better conflict resolution for offline-first scenarios
- Implement Yjs or Automerge for collaborative editing

### RevenueCat Integration
- Complete iOS/Android in-app purchase verification
- Unified subscription management across platforms

### Storage Integration
- Use Supabase Storage for large image files
- Store only references in database

### Analytics
- Track usage metrics
- Monitor sync performance
- User engagement analytics

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
