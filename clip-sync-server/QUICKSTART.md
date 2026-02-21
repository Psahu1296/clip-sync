# Quick Start Guide

Get your Clip Sync Server up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed

## Step 1: Clone & Install (1 minute)

```bash
cd clip-sync-server
npm install
```

## Step 2: Set Up Supabase (2 minutes)

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: clip-sync
   - **Database Password**: (choose a strong password)
   - **Region**: (closest to you)
4. Click "Create new project"
5. Wait ~2 minutes for project to be ready

### Get Your Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** → This is your `SUPABASE_URL`
   - **anon/public key** → This is your `SUPABASE_ANON_KEY`
   - **service_role key** → This is your `SUPABASE_SERVICE_ROLE_KEY`

3. Go to **Project Settings** → **API** → **JWT Settings**
   - Copy **JWT Secret** → This is your `SUPABASE_JWT_SECRET`

4. Go to **Project Settings** → **Database** → **Connection string**
   - Copy **URI** connection string → This is your `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your database password

## Step 3: Configure Environment (1 minute)

```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase credentials:

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

## Step 4: Run Migrations (30 seconds)

```bash
npm run migrate
```

You should see:
```
Starting database migrations...
Running migration: 001_initial_schema.sql
✓ Completed: 001_initial_schema.sql
All migrations completed successfully!
```

## Step 5: Start the Server (30 seconds)

```bash
npm run dev
```

You should see:
```
Server started { port: 3000, env: 'development', apiVersion: 'v1' }
```

## Step 6: Test It! (30 seconds)

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-10T06:18:22.000Z"
  }
}
```

🎉 **Success!** Your server is running!

## Next Steps

### Test with a Real User

1. **Create a test user in Supabase:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Click "Create user"

2. **Get a JWT token:**
   - You can use Supabase client library in your app
   - Or use the Supabase dashboard to get a test token

3. **Test the API:**

```bash
# Replace YOUR_JWT_TOKEN with actual token
export TOKEN="YOUR_JWT_TOKEN"

# Get user info
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/user/me

# Register a device
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "deviceName": "Test Device"
  }' \
  http://localhost:3000/api/v1/device/register

# Push a clip
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{
      "id": "clip-uuid-1",
      "deviceId": "550e8400-e29b-41d4-a716-446655440000",
      "encryptedBlob": "base64-encrypted-test-data",
      "contentType": "text",
      "createdAt": "2026-01-10T06:18:22.000Z",
      "updatedAt": "2026-01-10T06:18:22.000Z"
    }]
  }' \
  http://localhost:3000/api/v1/sync/push

# Pull clips
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/sync/pull
```

### Enable Authentication Providers

**Google Sign-In:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Follow instructions to set up OAuth credentials
4. Add authorized redirect URIs

**Apple Sign-In:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Apple
3. Follow instructions to set up Apple Developer credentials
4. Add service IDs and key

### Optional: Set Up Stripe

If you want to test payments:

1. **Create Stripe account** at [stripe.com](https://stripe.com)
2. **Get test API keys:**
   - Dashboard → Developers → API keys
   - Copy "Secret key" (starts with `sk_test_`)
3. **Create a product:**
   - Dashboard → Products → Add product
   - Name: "Pro Plan"
   - Price: $9.99/month (or your choice)
   - Copy the Price ID (starts with `price_`)
4. **Add to .env:**
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_ID_PRO=price_...
   ```
5. **Restart server**

## Troubleshooting

### "Missing required environment variables"

Make sure all required variables in `.env` are set:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_JWT_SECRET
- DATABASE_URL

### "Database health check failed"

- Check your DATABASE_URL is correct
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Verify Supabase project is running

### "Migration failed"

- Make sure DATABASE_URL is correct
- Check if you have network access to Supabase
- Verify database password is correct

### "Invalid or expired token"

- Make sure you're using a valid Supabase JWT token
- Token must be from the same Supabase project
- Check token hasn't expired

### Port 3000 already in use

Change the port in `.env`:
```env
PORT=3001
```

## Development Tips

### Watch Mode

The dev server uses `tsx watch` which automatically restarts on file changes.

### View Logs

Logs are output to console in development. In production, they're also written to files in `logs/` directory.

### Database GUI

Use Supabase's built-in Table Editor:
- Go to Supabase Dashboard → Table Editor
- View and edit data directly

Or use a PostgreSQL client:
- [TablePlus](https://tableplus.com/)
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)

### API Testing

Use these tools to test the API:
- **cURL**: Command line (examples above)
- **Postman**: GUI for API testing
- **Insomnia**: Alternative to Postman
- **Thunder Client**: VS Code extension

### VS Code Extensions

Recommended extensions:
- ESLint
- Prettier
- Thunder Client (API testing)
- PostgreSQL (database management)

## What's Next?

1. **Read the full documentation:**
   - [README.md](README.md) - Overview
   - [API.md](API.md) - Complete API reference
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy to production
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design

2. **Build your client app:**
   - Use the API endpoints documented in API.md
   - Implement E2EE on the client side
   - Handle sync logic

3. **Deploy to production:**
   - Follow DEPLOYMENT.md for Render.com
   - Set up monitoring and alerts
   - Configure custom domain

4. **Add features:**
   - Implement payment flow
   - Add analytics
   - Build admin dashboard

## Getting Help

- **Documentation**: Check the docs in this repository
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Express Docs**: [expressjs.com](https://expressjs.com/)
- **Issues**: Open an issue on GitHub

Happy coding! 🚀
