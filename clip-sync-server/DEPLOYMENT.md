# Deployment Guide

## Render.com Deployment

### Prerequisites
- GitHub/GitLab repository with your code
- Render.com account
- Supabase project set up

### Step-by-Step Deployment

#### 1. Prepare Your Repository

Ensure your repository has:
- `package.json` with build and start scripts
- `.env.example` (do NOT commit `.env`)
- All source code committed

#### 2. Create Web Service on Render

1. Log in to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure the service:

**Basic Settings:**
- Name: `clip-sync-server` (or your preferred name)
- Region: Choose closest to your users
- Branch: `main` (or your default branch)
- Runtime: `Node`

**Build & Deploy:**
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Instance Type:**
- Free tier: Select "Free" (with limitations)
- Production: Select "Starter" or higher

#### 3. Environment Variables

Add the following environment variables in Render dashboard:

**Required:**
```
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

**Optional (for payments):**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com
```

#### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Monitor the logs for any errors
4. Once deployed, note your service URL: `https://clip-sync-server.onrender.com`

#### 5. Run Migrations

**Option A: Using Render Shell**
1. Go to your service dashboard
2. Click "Shell" tab
3. Run: `npm run migrate`

**Option B: Using Local Connection**
```bash
DATABASE_URL=your-production-db-url npm run migrate
```

#### 6. Configure Webhooks

**Stripe Webhook:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-service.onrender.com/api/v1/billing/webhook/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var

**RevenueCat Webhook:**
1. Go to RevenueCat Dashboard → Integrations → Webhooks
2. Add webhook URL: `https://your-service.onrender.com/api/v1/billing/webhook/revenuecat`
3. Copy webhook secret to `REVENUECAT_WEBHOOK_SECRET` env var

### Free Tier Limitations

Render's free tier has some limitations:
- **Spin down after inactivity**: Service sleeps after 15 minutes of no requests
- **Cold starts**: First request after sleep takes 30-60 seconds
- **750 hours/month**: Shared across all free services
- **Limited resources**: 512MB RAM, 0.1 CPU

**Workarounds:**
- Use a cron job to ping your service every 10 minutes (e.g., via cron-job.org)
- Upgrade to Starter plan ($7/month) for always-on service

### Scaling Up

When you're ready to scale:

**Starter Plan ($7/month):**
- Always-on (no sleep)
- 512MB RAM
- Better performance

**Standard Plan ($25/month):**
- 2GB RAM
- Auto-scaling
- Better for production

**Pro Plan ($85/month):**
- 4GB RAM
- High availability
- Priority support

## Alternative Deployment Options

### Railway.app

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically
4. Similar pricing to Render

### Heroku

1. Create new app
2. Add PostgreSQL addon (or use Supabase)
3. Set config vars (environment variables)
4. Deploy via Git push

```bash
heroku create clip-sync-server
heroku config:set SUPABASE_URL=...
git push heroku main
```

### DigitalOcean App Platform

1. Create new app from GitHub
2. Configure build/run commands
3. Add environment variables
4. Deploy

### Self-Hosted (VPS)

**Requirements:**
- Ubuntu 20.04+ server
- Node.js 18+
- PM2 for process management
- Nginx for reverse proxy

**Setup:**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and setup
git clone your-repo
cd clip-sync-server
npm install
npm run build

# Create .env file
nano .env
# (paste your environment variables)

# Start with PM2
pm2 start dist/index.js --name clip-sync-server
pm2 save
pm2 startup

# Configure Nginx
sudo nano /etc/nginx/sites-available/clip-sync-server
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring & Logs

### Render Logs
- Access via Render dashboard → Logs tab
- Real-time log streaming
- Search and filter capabilities

### External Monitoring

**Recommended tools:**
- **Sentry**: Error tracking and monitoring
- **LogDNA/Datadog**: Log aggregation
- **UptimeRobot**: Uptime monitoring
- **New Relic**: Application performance monitoring

## Database Backups

Supabase provides automatic backups, but for extra safety:

1. **Enable Point-in-Time Recovery** in Supabase (paid plans)
2. **Manual backups** using pg_dump:

```bash
pg_dump $DATABASE_URL > backup.sql
```

3. **Automated backups** using cron:

```bash
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

## SSL/HTTPS

Render provides automatic SSL certificates via Let's Encrypt. No configuration needed!

For custom domains:
1. Add custom domain in Render dashboard
2. Update DNS records as instructed
3. SSL certificate will be automatically provisioned

## Troubleshooting

### Service won't start
- Check logs for errors
- Verify all required environment variables are set
- Ensure database is accessible

### Database connection errors
- Verify DATABASE_URL is correct
- Check Supabase connection pooler settings
- Ensure IP whitelist includes Render IPs (or use connection pooler)

### Webhook failures
- Verify webhook URLs are correct
- Check webhook signing secrets
- Review webhook logs in Stripe/RevenueCat dashboard

### High memory usage
- Increase instance size
- Optimize database queries
- Implement caching (Redis)

## Cost Optimization

1. **Use Supabase free tier** (up to 500MB database, 2GB bandwidth)
2. **Start with Render free tier** for development
3. **Upgrade only when needed** based on traffic
4. **Monitor usage** to avoid surprise bills
5. **Use CDN** for static assets (Cloudflare)

## Security Checklist

- [ ] All environment variables set correctly
- [ ] CORS origins configured properly
- [ ] Rate limiting enabled
- [ ] Webhook secrets configured
- [ ] Database RLS policies enabled
- [ ] SSL/HTTPS enabled
- [ ] Logs don't expose sensitive data
- [ ] Regular security updates (npm audit)
