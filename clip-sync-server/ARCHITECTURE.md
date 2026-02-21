# Architecture & Future Enhancements

## Current Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│         Client (Mobile App)         │
│    (Handles E2EE, Local Storage)    │
└─────────────────┬───────────────────┘
                  │ HTTPS + JWT
┌─────────────────▼───────────────────┐
│          Express Server             │
│  ┌──────────────────────────────┐   │
│  │   Middleware Layer           │   │
│  │  - Auth (JWT validation)     │   │
│  │  - Rate Limiting             │   │
│  │  - Error Handling            │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Routes Layer               │   │
│  │  - User, Device, Sync, Clip  │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Controllers Layer          │   │
│  │  - Request validation        │   │
│  │  - Response formatting       │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Services Layer             │   │
│  │  - Business logic            │   │
│  │  - Plan enforcement          │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Database Layer             │   │
│  │  - Query execution           │   │
│  │  - Transactions              │   │
│  └──────────────────────────────┘   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Supabase (PostgreSQL)          │
│  - Users, Devices, Clips tables     │
│  - Row Level Security (RLS)         │
└─────────────────────────────────────┘
```

### Data Flow

**Sync Push:**
1. Client encrypts clip data
2. Client sends encrypted blob to server
3. Server validates JWT token
4. Server checks plan limits
5. Server validates device ownership
6. Server upserts clip to database
7. Server updates device sync timestamp
8. Server returns success response

**Sync Pull:**
1. Client requests clips since last sync
2. Server validates JWT token
3. Server queries clips for user
4. Server returns encrypted blobs
5. Client decrypts and merges locally

### Security Model

**End-to-End Encryption:**
- Client generates encryption key from user passphrase
- All clip data encrypted before leaving client
- Server stores only encrypted blobs
- Server never has access to encryption key
- Decryption only happens on client

**Authentication:**
- Supabase handles OAuth (Google, Apple) and email auth
- Server validates Supabase JWT on every request
- JWT contains user ID and expiration
- No session storage on server (stateless)

**Authorization:**
- Row Level Security (RLS) in PostgreSQL
- Users can only access their own data
- Device ownership validated on every sync
- Plan limits enforced server-side

## Future Enhancements

### 1. WebSocket Real-Time Sync

**Problem:** Current polling-based sync has latency and wastes resources.

**Solution:** Implement WebSocket connections for real-time updates.

**Implementation:**
```typescript
// Add Socket.io
import { Server } from 'socket.io';

// In app.ts
const io = new Server(server, {
  cors: { origin: config.cors.allowedOrigins }
});

// Authenticate socket connections
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  // Validate JWT and attach userId
  next();
});

// Handle sync events
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  
  // Join user's room
  socket.join(`user:${userId}`);
  
  // Listen for clip updates
  socket.on('clip:push', async (clips) => {
    await clipService.syncPush(userId, clips);
    // Broadcast to other devices
    socket.to(`user:${userId}`).emit('clip:update', clips);
  });
});
```

**Benefits:**
- Instant sync across devices
- Reduced server load (no polling)
- Better user experience

### 2. CRDT for Conflict Resolution

**Problem:** Current implementation relies on client-side conflict resolution.

**Solution:** Use Conflict-Free Replicated Data Types (CRDTs) for automatic merge.

**Options:**
- **Yjs**: Collaborative editing framework
- **Automerge**: CRDT library for JSON data
- **Custom CRDT**: Implement Last-Write-Wins (LWW) with vector clocks

**Implementation Example (LWW):**
```typescript
interface ClipWithVector {
  id: string;
  encryptedBlob: string;
  contentType: ContentType;
  vectorClock: Record<string, number>; // deviceId -> counter
  timestamp: Date;
}

function mergeClips(local: ClipWithVector, remote: ClipWithVector): ClipWithVector {
  // Compare vector clocks
  const localNewer = isVectorNewer(local.vectorClock, remote.vectorClock);
  const remoteNewer = isVectorNewer(remote.vectorClock, local.vectorClock);
  
  if (localNewer && !remoteNewer) return local;
  if (remoteNewer && !localNewer) return remote;
  
  // Concurrent edits - use timestamp as tiebreaker
  return local.timestamp > remote.timestamp ? local : remote;
}
```

**Benefits:**
- Automatic conflict resolution
- No data loss
- Better offline support

### 3. RevenueCat Integration

**Current State:** Stub implementation only.

**Full Implementation:**

```typescript
// Install SDK
npm install @revenuecat/purchases-typescript-sdk

// In billing/revenuecat.ts
import { Purchases } from '@revenuecat/purchases-typescript-sdk';

const purchases = new Purchases({
  apiKey: config.revenueCat.apiKey,
});

async function verifyPurchase(request: IAPVerifyRequest): Promise<boolean> {
  try {
    const subscriber = await purchases.getSubscriber(request.userId);
    
    // Check if user has active subscription
    const hasActiveSub = subscriber.entitlements.active['pro'] !== undefined;
    
    if (hasActiveSub) {
      // Update user plan in database
      await userService.updateUserPlan(request.userId, 'pro');
    }
    
    return hasActiveSub;
  } catch (error) {
    logger.error('RevenueCat verification failed', { error });
    return false;
  }
}
```

**Webhook Handler:**
```typescript
async function handleWebhook(payload: RevenueCatWebhookEvent): Promise<void> {
  const userId = payload.event.app_user_id;
  const eventType = payload.event.type;
  
  // Verify webhook signature
  const isValid = verifyWebhookSignature(payload);
  if (!isValid) throw new Error('Invalid signature');
  
  // Handle events...
}
```

### 4. Supabase Storage for Images

**Problem:** Large images stored as base64 in database are inefficient.

**Solution:** Use Supabase Storage for binary files.

**Implementation:**
```typescript
// In services/clipService.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

async function uploadImage(userId: string, clipId: string, imageData: Buffer): Promise<string> {
  const path = `${userId}/${clipId}.enc`; // .enc indicates encrypted
  
  const { data, error } = await supabase.storage
    .from('clips')
    .upload(path, imageData, {
      contentType: 'application/octet-stream',
      upsert: true,
    });
  
  if (error) throw error;
  
  return data.path;
}

async function getImageUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from('clips')
    .createSignedUrl(path, 3600); // 1 hour expiry
  
  return data.signedUrl;
}
```

**Database Schema Update:**
```sql
ALTER TABLE clips ADD COLUMN storage_path TEXT;
ALTER TABLE clips ALTER COLUMN encrypted_blob DROP NOT NULL;
```

**Benefits:**
- Reduced database size
- Better performance
- Easier to implement file size limits

### 5. Caching Layer (Redis)

**Problem:** Frequent database queries for user plan and device info.

**Solution:** Add Redis caching layer.

**Implementation:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getUserPlan(userId: string): Promise<UserPlan> {
  // Try cache first
  const cached = await redis.get(`user:${userId}:plan`);
  if (cached) return cached as UserPlan;
  
  // Fetch from database
  const user = await userService.getUserById(userId);
  
  // Cache for 5 minutes
  await redis.setex(`user:${userId}:plan`, 300, user.plan);
  
  return user.plan;
}

// Invalidate cache on plan update
async function updateUserPlan(userId: string, plan: UserPlan): Promise<void> {
  await userService.updateUserPlan(userId, plan);
  await redis.del(`user:${userId}:plan`);
}
```

**Benefits:**
- Reduced database load
- Faster response times
- Better scalability

### 6. Analytics & Monitoring

**Metrics to Track:**
- Sync frequency per user
- Average clip size
- Device distribution
- Conversion rate (free → pro)
- API response times
- Error rates

**Implementation:**
```typescript
// Add Sentry for error tracking
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: config.env,
});

// Add custom metrics
import { StatsD } from 'node-statsd';

const statsd = new StatsD();

// Track sync events
statsd.increment('sync.push', clips.length);
statsd.timing('sync.push.duration', duration);
```

### 7. Background Jobs

**Use Cases:**
- Clean up old deleted clips
- Send email notifications
- Generate usage reports
- Process webhooks asynchronously

**Implementation:**
```typescript
// Using Bull queue
import Queue from 'bull';

const cleanupQueue = new Queue('cleanup', process.env.REDIS_URL);

// Add job
cleanupQueue.add('delete-old-clips', {}, {
  repeat: { cron: '0 2 * * *' } // Daily at 2 AM
});

// Process job
cleanupQueue.process('delete-old-clips', async (job) => {
  const deleted = await clipService.hardDeleteOldClips(90);
  logger.info('Cleanup completed', { deleted });
});
```

### 8. Multi-Region Deployment

**For Global Users:**
- Deploy to multiple regions (US, EU, Asia)
- Use GeoDNS to route to nearest server
- Replicate database across regions
- Implement eventual consistency

**Architecture:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  US Server  │────▶│ Primary DB  │◀────│  EU Server  │
└─────────────┘     │  (US East)  │     └─────────────┘
                    └──────┬──────┘
                           │ Replication
                    ┌──────▼──────┐
                    │ Replica DB  │
                    │  (EU West)  │
                    └─────────────┘
```

### 9. Rate Limiting Improvements

**Current:** Simple time-window based limiting.

**Improvements:**
- Token bucket algorithm for burst handling
- Per-user rate limits based on plan
- Adaptive rate limiting based on server load

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 60 seconds if exceeded
});

// Different limits for different plans
const planLimits = {
  free: { points: 30, duration: 60 },
  pro: { points: 100, duration: 60 },
};
```

### 10. GraphQL API (Optional)

**Alternative to REST:**

```typescript
import { ApolloServer } from '@apollo/server';

const typeDefs = `
  type Clip {
    id: ID!
    encryptedBlob: String!
    contentType: ContentType!
    createdAt: DateTime!
  }
  
  type Query {
    clips(since: DateTime): [Clip!]!
    subscription: SubscriptionInfo!
  }
  
  type Mutation {
    pushClips(clips: [ClipInput!]!): SyncResult!
    deleteClip(id: ID!): Boolean!
  }
`;

const server = new ApolloServer({ typeDefs, resolvers });
```

**Benefits:**
- Flexible queries
- Reduced over-fetching
- Better for complex data relationships

## Migration Path

**Phase 1: Stability (Current)**
- ✅ Core REST API
- ✅ E2EE support
- ✅ Plan enforcement
- ✅ Stripe integration

**Phase 2: Performance (Next 3 months)**
- [ ] WebSocket sync
- [ ] Redis caching
- [ ] Supabase Storage for images
- [ ] Background jobs

**Phase 3: Scale (6 months)**
- [ ] CRDT conflict resolution
- [ ] Multi-region deployment
- [ ] Advanced analytics
- [ ] RevenueCat integration

**Phase 4: Advanced (12 months)**
- [ ] GraphQL API
- [ ] AI-powered features (clip categorization)
- [ ] Team/family plans
- [ ] Public clip sharing

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Sync latency | ~2s (polling) | <100ms (WebSocket) |
| API response time | <200ms | <100ms |
| Database queries | ~5 per sync | ~2 per sync (caching) |
| Concurrent users | 100 | 10,000+ |
| Uptime | 99% | 99.9% |

## Cost Projections

**Current (Free Tier):**
- Render: $0
- Supabase: $0
- Total: $0/month

**Small Scale (1,000 users):**
- Render Starter: $7
- Supabase Pro: $25
- Total: $32/month

**Medium Scale (10,000 users):**
- Render Standard: $25
- Supabase Pro: $25
- Redis: $10
- Total: $60/month

**Large Scale (100,000 users):**
- Render Pro: $85
- Supabase Team: $599
- Redis: $50
- Monitoring: $50
- Total: $784/month
