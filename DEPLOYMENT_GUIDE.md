# Bluemantle Production Deployment Guide

Complete guide for deploying Bluemantle to production environments.

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] No console.log statements (except critical)
- [ ] Error handling implemented
- [ ] Performance optimized
- [ ] Security audit completed
- [ ] Code reviewed by team

### Documentation
- [ ] README updated
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Deployment steps clear

### Infrastructure
- [ ] Database (MongoDB Atlas) ready
- [ ] Domain names ready
- [ ] SSL certificates obtained
- [ ] Hosting accounts prepared
- [ ] CDN configured (optional)

---

## 🗄️ Database Deployment (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create organization and project
4. Click "Build a Database"
5. Choose M0 (free) or M2 (low cost) tier
6. Select your region (choose close to your backend)
7. Click "Create"

### Step 2: Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Generate secure password (32+ characters)
5. **Save credentials securely**
6. Click "Add User"

### Step 3: Configure Network Access

1. Go to "Network Access"
2. Click "Add IP Address"
3. Option A (Production): Add your server's IP
4. Option B (Development): Add 0.0.0.0/0 (insecure!)
5. Click "Confirm"

### Step 4: Get Connection String

1. Click "Connect" next to cluster
2. Choose "Connect your application"
3. Select Node.js and version
4. Copy connection string
5. Replace `<password>` with your database user password

### Step 5: Create Collections

```javascript
// Create indexes for optimal performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ deviceHash: 1 });

db.courses.createIndex({ instructor: 1 });

db.progress.createIndex({ userId: 1, courseId: 1 }, { unique: true });

db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## 🔧 Backend Deployment

### Hosting Options

#### Option A: Heroku (Easiest)

**1. Install Heroku CLI**
```bash
npm install -g heroku
heroku login
```

**2. Create Heroku App**
```bash
cd Bluemantle-backend
heroku create bluemantle-api
```

**3. Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
heroku config:set MONGO_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your-64-character-secret
heroku config:set FRONTEND_URL=https://your-frontend-domain.com
heroku config:set CORS_ORIGINS=https://your-frontend-domain.com
heroku config:set ZOOM_CLIENT_ID=...
heroku config:set ZOOM_CLIENT_SECRET=...
# ... add all other variables
```

**4. Deploy**
```bash
git push heroku main
heroku logs --tail
```

#### Option B: AWS EC2

**1. Launch EC2 Instance**
- Type: t3.micro (free tier eligible)
- OS: Ubuntu 20.04 LTS
- Security Group: Allow ports 22, 80, 443, 5000

**2. SSH into Instance**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

**3. Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**4. Install MongoDB CLI Tools**
```bash
sudo apt-get install -y mongodb-mongosh
```

**5. Clone and Setup**
```bash
git clone <repo>
cd Bluemantle-backend
npm install

# Create .env with production values
nano .env
```

**6. Setup PM2 for Process Management**
```bash
sudo npm install -g pm2
pm2 start server.js --name "bluemantle-api"
pm2 startup
pm2 save
```

**7. Setup Nginx Reverse Proxy**
```bash
sudo apt-get install -y nginx

# Create config file
sudo nano /etc/nginx/sites-available/bluemantle

# Add:
server {
    listen 80;
    server_name api.bluemantle.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/bluemantle /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**8. Setup SSL with Let's Encrypt**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.bluemantle.com
```

#### Option C: DigitalOcean App Platform

**1. Connect GitHub Repository**
- Go to DigitalOcean
- Click "Create" → "Apps"
- Select your GitHub repo
- Choose Bluemantle-backend

**2. Set Environment Variables**
```
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
# ... other variables
```

**3. Deploy**
- Click "Deploy"
- Wait for build and deployment
- Get production URL

### Backend Health Check

```bash
# Test API is running
curl https://your-backend-domain.com/

# Expected response
# "API running..."

# Test database connection
curl https://your-backend-domain.com/api/health

# Expected response
# { "status": "ok", "database": "connected" }
```

---

## 🎨 Frontend Deployment

### Hosting Options

#### Option A: Vercel (Recommended for Next.js)

**1. Connect GitHub**
- Go to [Vercel](https://vercel.com)
- Click "Import Git Repository"
- Select your GitHub repo
- Choose Bluemantle-frontend folder

**2. Set Environment Variables**
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

**3. Deploy**
- Click "Deploy"
- Wait for build
- Get production URL (e.g., bluemantle.vercel.app)

**4. Connect Custom Domain**
- Go to Settings → Domains
- Add your custom domain
- Update DNS records as shown

#### Option B: Netlify

**1. Connect Repository**
- Go to [Netlify](https://netlify.com)
- Click "Add new site" → "Import existing project"
- Select GitHub repo
- Choose Bluemantle-frontend

**2. Configure Build**
```
Build command: npm run build
Publish directory: out
Environment variables:
  NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

**3. Deploy**
- Netlify builds and deploys automatically

#### Option C: Traditional Hosting (Shared/VPS)

**1. Build Application**
```bash
cd Bluemantle-frontend
npm run build
```

**2. Upload Files**
- Use FTP or SFTP
- Upload contents of `.next/` directory
- Upload `public/` directory
- Upload `package.json` and `package-lock.json`

**3. Install and Run**
```bash
npm install --production
npm start
```

**4. Use PM2**
```bash
pm2 start "npm start" --name "bluemantle-frontend"
pm2 save
```

---

## 🔒 SSL/HTTPS Configuration

### Get Free SSL Certificate (Let's Encrypt)

**Using Certbot:**
```bash
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo certbot renew --dry-run
```

### Configure Nginx for HTTPS

```nginx
server {
    listen 443 ssl http2;
    server_name api.bluemantle.com;
    
    ssl_certificate /etc/letsencrypt/live/api.bluemantle.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.bluemantle.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:5000;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.bluemantle.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 Environment Variables Checklist

### Backend Production `.env`

```env
# ========== CORE ==========
NODE_ENV=production
PORT=5000

# ========== DATABASE ==========
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/bluemantle?retryWrites=true

# ========== AUTHENTICATION ==========
JWT_SECRET=your-64-character-production-secret-key-minimum
JWT_EXPIRY=24h

# ========== FRONTEND ==========
FRONTEND_URL=https://bluemantle.com
CORS_ORIGINS=https://bluemantle.com

# ========== ZOOM ==========
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
SDK_ID=your_sdk_id
SDK_SECRET=your_sdk_secret

# ========== YOUTUBE ==========
YOUTUBE_API_KEY=your_api_key
YOUTUBE_CHANNEL_ID=your_channel_id

# ========== EMAIL ==========
MAIL_SERVICE=gmail
MAIL_USER=no-reply@bluemantle.com
MAIL_PASS=your_app_specific_password

# ========== LOGGING ==========
LOG_LEVEL=info
LOG_FILE=/var/log/bluemantle/api.log
```

### Frontend Production `.env.production`

```env
NEXT_PUBLIC_API_URL=https://api.bluemantle.com/api
NEXT_PUBLIC_APP_URL=https://bluemantle.com
```

---

## 🚀 Deployment Order

**Critical**: Deploy in this exact order!

### Step 1: Database
- Create MongoDB Atlas cluster
- Configure network access
- Verify connection
- Create collections and indexes

### Step 2: Backend
- Deploy to your chosen platform
- Set all environment variables
- Run health check: `curl https://api.bluemantle.com/`
- Verify database connection

### Step 3: Frontend
- Update `NEXT_PUBLIC_API_URL` to production backend
- Deploy to your chosen platform
- Test login functionality
- Verify API communication

### Step 4: DNS Configuration
- Update DNS records for your domains
- Allow 24-48 hours for propagation
- Test https:// access

---

## ✅ Post-Deployment Verification

### Backend Checks
```bash
# Health check
curl https://api.bluemantle.com/

# Database connection
curl https://api.bluemantle.com/api/health

# Courses endpoint
curl https://api.bluemantle.com/api/courses

# Login endpoint
curl -X POST https://api.bluemantle.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### Frontend Checks
```
1. Visit https://bluemantle.com
2. Verify page loads without errors
3. Check browser console (F12) for errors
4. Test login page
5. Verify API calls succeed
6. Check page performance (Lighthouse)
```

### Security Verification
```bash
# Check HTTPS
echo | openssl s_client -connect api.bluemantle.com:443 2>/dev/null | grep Verify

# Check security headers
curl -I https://api.bluemantle.com/ | grep -E "Strict-Transport|X-Frame|X-Content"

# Check CORS
curl -X OPTIONS https://api.bluemantle.com/ -H "Origin: https://bluemantle.com"
```

---

## 📊 Performance Optimization

### Database
- Enable connection pooling
- Create indexes for common queries
- Monitor slow queries
- Use caching layer (Redis)

### Backend
- Enable compression: `npm install compression`
- Optimize dependencies
- Use async/await properly
- Implement rate limiting

### Frontend
- Enable Next.js caching
- Optimize images
- Code splitting
- Use CDN for static assets

---

## 📈 Monitoring & Logging

### Essential Metrics to Monitor

```
- Response time (< 500ms target)
- Error rate (< 1% target)
- CPU usage (< 75%)
- Memory usage (< 80%)
- Database connections active
- Login success/failure rate
```

### Logging Services

**Option A: Heroku Logs**
```bash
heroku logs --tail
heroku logs --tail --app bluemantle-api
```

**Option B: CloudWatch (AWS)**
- Setup CloudWatch agent
- Create dashboards
- Set up alarms

**Option C: Datadog/New Relic**
- Professional monitoring
- APM insights
- Performance analytics

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Test Backend
        run: |
          cd Bluemantle-backend
          npm install
          npm test
      
      - name: Deploy Backend
        run: |
          cd Bluemantle-backend
          git push heroku main
      
      - name: Test Frontend
        run: |
          cd Bluemantle-frontend
          npm install
          npm run build
      
      - name: Deploy Frontend
        run: npm run deploy
```

---

## 🆘 Rollback Plan

If deployment fails:

### Backend Rollback
```bash
# Heroku
heroku rollback

# AWS
pm2 delete bluemantle-api
pm2 start server.js (from previous version)

# Docker
docker pull your-registry/bluemantle:previous-tag
docker run -d --name bluemantle bluemantle:previous-tag
```

### Frontend Rollback
```bash
# Vercel
Click "Deployments" → Select previous → Click "Promote to Production"

# Netlify
Go to "Deploys" → Select previous → Click "Publish deploy"
```

### Database Rollback
- MongoDB Atlas has backups
- Go to "Backup and Restore"
- Select previous backup
- Restore to new cluster
- Update connection string

---

## 📞 Support & Troubleshooting

### Common Issues

**Database Connection Fails**
- Check IP whitelist in MongoDB Atlas
- Verify credentials
- Check MONGO_URI format

**CORS Errors**
- Verify FRONTEND_URL matches exactly
- Ensure CORS_ORIGINS includes production domain
- Check browser console for actual origin

**Login Not Working**
- Check JWT_SECRET is set
- Verify email service credentials
- Check logs for specific errors

**Slow Performance**
- Check database indexes
- Monitor server resources
- Enable caching
- Use CDN for static assets

---

## 📚 Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas Guide](https://docs.mongodb.com/atlas/)
- [SSL/TLS Configuration](https://certbot.eff.org/)

---

## ✨ Deployment Complete!

Once deployed:
1. Test all features thoroughly
2. Monitor logs and metrics
3. Set up automated backups
4. Configure alerts
5. Document your setup
6. Plan for maintenance windows

Congratulations on your production deployment! 🎉

