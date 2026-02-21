# Project Structure

```
clip-sync-server/
│
├── 📄 Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── .eslintrc.json            # ESLint rules
│   ├── .env.example              # Environment variables template
│   ├── .gitignore                # Git ignore rules
│   └── render.yaml               # Render.com deployment config
│
├── 📚 Documentation
│   ├── README.md                 # Project overview and setup
│   ├── QUICKSTART.md             # 5-minute setup guide
│   ├── API.md                    # Complete API reference
│   ├── DEPLOYMENT.md             # Production deployment guide
│   └── ARCHITECTURE.md           # System design and future plans
│
├── 🗄️ Database
│   └── migrations/
│       └── 001_initial_schema.sql  # Initial database schema
│
├── 🔧 Scripts
│   └── scripts/
│       └── migrate.js            # Database migration runner
│
└── 💻 Source Code (src/)
    │
    ├── 📱 Application Entry
    │   ├── index.ts              # Server startup and lifecycle
    │   └── app.ts                # Express app configuration
    │
    ├── ⚙️ Configuration
    │   └── config/
    │       └── index.ts          # Environment config loader
    │
    ├── 🎯 Types
    │   └── types/
    │       ├── index.ts          # Core domain types
    │       └── express.ts        # Express extensions
    │
    ├── 🛠️ Utilities
    │   └── utils/
    │       ├── logger.ts         # Winston logger setup
    │       └── errors.ts         # Error handling utilities
    │
    ├── 🗃️ Database
    │   └── db/
    │       └── index.ts          # PostgreSQL connection pool
    │
    ├── 🔐 Middleware
    │   └── middleware/
    │       ├── auth.ts           # JWT authentication
    │       ├── errorHandler.ts   # Global error handling
    │       └── rateLimiter.ts    # Rate limiting configs
    │
    ├── 🏢 Services (Business Logic)
    │   └── services/
    │       ├── userService.ts    # User management
    │       ├── deviceService.ts  # Device management
    │       └── clipService.ts    # Clip sync logic
    │
    ├── 🎮 Controllers (Request Handlers)
    │   └── controllers/
    │       ├── userController.ts     # User endpoints
    │       ├── deviceController.ts   # Device endpoints
    │       ├── syncController.ts     # Sync endpoints
    │       └── billingController.ts  # Payment endpoints
    │
    ├── 💳 Billing Integrations
    │   └── billing/
    │       ├── stripe.ts         # Stripe integration
    │       └── revenuecat.ts     # RevenueCat stub
    │
    └── 🛣️ Routes (API Endpoints)
        └── routes/
            ├── index.ts          # Route aggregator
            ├── userRoutes.ts     # /user/* endpoints
            ├── deviceRoutes.ts   # /device/* endpoints
            ├── syncRoutes.ts     # /sync/* endpoints
            ├── clipRoutes.ts     # /clip/* endpoints
            └── billingRoutes.ts  # /billing/* endpoints
```

## File Count Summary

| Category | Count | Description |
|----------|-------|-------------|
| TypeScript Source | 24 | Application code |
| SQL Migrations | 1 | Database schema |
| JavaScript Scripts | 1 | Utility scripts |
| JSON Config | 3 | Configuration files |
| Markdown Docs | 5 | Documentation |
| YAML Config | 1 | Deployment config |
| **Total** | **35** | **All project files** |

## Code Organization

### Layer Architecture

```
┌─────────────────────────────────────────┐
│            Routes Layer                 │  ← API endpoint definitions
│  (userRoutes, deviceRoutes, etc.)       │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Controllers Layer               │  ← Request validation & response
│  (userController, deviceController)     │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          Services Layer                 │  ← Business logic & plan rules
│  (userService, deviceService)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Database Layer                  │  ← Query execution
│  (db/index.ts)                          │
└─────────────────────────────────────────┘
```

### Middleware Pipeline

```
Request
  │
  ├─→ CORS
  ├─→ Helmet (Security)
  ├─→ Body Parser
  ├─→ Rate Limiter
  ├─→ Request Logger
  ├─→ JWT Auth (protected routes)
  ├─→ Route Handler
  └─→ Error Handler
  │
Response
```

## Key Features by File

### Authentication & Security
- `middleware/auth.ts` - JWT validation with Supabase
- `middleware/rateLimiter.ts` - DDoS protection
- `utils/errors.ts` - Standardized error handling

### Data Management
- `services/clipService.ts` - E2EE clip storage
- `services/deviceService.ts` - Multi-device support
- `services/userService.ts` - Plan enforcement

### Payment Integration
- `billing/stripe.ts` - Subscription management
- `billing/revenuecat.ts` - Mobile IAP (stub)
- `controllers/billingController.ts` - Payment endpoints

### Database
- `migrations/001_initial_schema.sql` - Schema with RLS
- `db/index.ts` - Connection pooling & transactions

## API Endpoint Map

```
/api/v1
├── /health                    GET    Public
├── /user
│   ├── /me                    GET    Protected
│   └── /subscription          GET    Protected
├── /device
│   ├── /register              POST   Protected
│   ├── /remove                POST   Protected
│   └── /list                  GET    Protected
├── /sync
│   ├── /push                  POST   Protected + Rate Limited
│   └── /pull                  GET    Protected + Rate Limited
├── /clip
│   ├── /delete                POST   Protected
│   └── /restore               POST   Protected
└── /billing
    ├── /checkout              POST   Protected
    ├── /iap/verify            POST   Protected
    ├── /webhook/stripe        POST   Public (signature verified)
    └── /webhook/revenuecat    POST   Public (signature verified)
```

## Database Schema

```sql
users
├── id (UUID, PK)
├── plan (enum: free|pro|enterprise)
└── created_at (timestamp)

devices
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── name (varchar)
├── last_sync_at (timestamp)
└── created_at (timestamp)

clips
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── device_id (UUID, FK → devices.id)
├── encrypted_blob (text)
├── content_type (enum: text|url|image)
├── created_at (timestamp)
├── updated_at (timestamp)
└── deleted (boolean)
```

## Dependencies Overview

### Production Dependencies
- **express** - Web framework
- **@supabase/supabase-js** - Supabase client
- **jsonwebtoken** - JWT validation
- **pg** - PostgreSQL driver
- **stripe** - Payment processing
- **winston** - Logging
- **zod** - Schema validation
- **helmet** - Security headers
- **cors** - Cross-origin support
- **express-rate-limit** - Rate limiting

### Development Dependencies
- **typescript** - Type safety
- **tsx** - TypeScript execution
- **eslint** - Code linting
- **@types/** - Type definitions

## Environment Variables

### Required
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin API key
- `SUPABASE_JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - PostgreSQL connection string

### Optional
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `STRIPE_PRICE_ID_PRO` - Pro plan price ID
- `REVENUECAT_API_KEY` - RevenueCat API key
- `ALLOWED_ORIGINS` - CORS allowed origins
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (default: info)

## Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Compile TypeScript to JavaScript
npm start          # Start production server
npm run migrate    # Run database migrations
npm run lint       # Lint code with ESLint
npm run type-check # Type check without building
```

## Testing Checklist

### Manual Testing
- [ ] Health check endpoint
- [ ] User registration via Supabase
- [ ] Device registration
- [ ] Clip push/pull
- [ ] Plan limit enforcement
- [ ] Rate limiting
- [ ] Error responses
- [ ] Webhook handling

### Integration Testing (Future)
- [ ] End-to-end sync flow
- [ ] Multi-device scenarios
- [ ] Payment flow
- [ ] Conflict resolution

### Load Testing (Future)
- [ ] Concurrent sync requests
- [ ] Database query performance
- [ ] Rate limit behavior
- [ ] Memory usage under load

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Supabase Auth providers enabled
- [ ] Stripe webhooks configured
- [ ] CORS origins set correctly
- [ ] SSL/HTTPS enabled
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Error tracking configured
- [ ] Load testing completed

## Maintenance Tasks

### Daily
- Monitor error logs
- Check uptime status

### Weekly
- Review usage metrics
- Check for security updates
- Monitor database size

### Monthly
- Update dependencies
- Review and optimize queries
- Analyze user feedback
- Plan new features

### Quarterly
- Security audit
- Performance optimization
- Cost analysis
- Backup verification
