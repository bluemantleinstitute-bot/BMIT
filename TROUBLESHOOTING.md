# Bluemantle Troubleshooting Guide

Common issues and their solutions for Bluemantle development and deployment.

---

## 🚀 Startup Issues

### Backend Won't Start: "Port 5000 already in use"

**Problem**: Another process is using port 5000

**Solutions**:

```bash
# Option 1: Find and kill process
lsof -i :5000
kill -9 <PID>

# Option 2: Use different port
PORT=5001 npm start

# Option 3: Stop other services
# On Mac:
brew services stop mongodb-community

# On Ubuntu:
sudo systemctl stop mongodb
```

---

### Frontend Build Fails: "Cannot find module '@react-three/fiber'"

**Problem**: Missing or incorrectly installed dependencies

**Solutions**:

```bash
# Clear cache and reinstall
cd Bluemantle-frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# If still failing, clear npm cache
npm cache clean --force
npm install --legacy-peer-deps
```

---

### "React version mismatch" Error

**Problem**: React 19 and React DOM version conflict

**Solutions**:

```bash
# Check versions
npm list react react-dom

# Should be:
# react@19.0.0
# react-dom@19.0.0

# If not matching, reinstall:
npm install react@19.0.0 react-dom@19.0.0 --save

# Clear node_modules and reinstall all
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## 🗄️ Database Issues

### MongoDB Connection Fails: "connect ECONNREFUSED 127.0.0.1:27017"

**Problem**: Local MongoDB is not running

**Solutions**:

**Mac (with Homebrew)**:
```bash
# Check if service exists
brew services list

# Start MongoDB
brew services start mongodb-community

# Verify it's running
brew services list | grep mongodb
```

**Ubuntu/Linux**:
```bash
# Start MongoDB
sudo systemctl start mongodb

# Or use
sudo service mongodb start

# Verify
sudo systemctl status mongodb
```

**Windows**:
```bash
# MongoDB should run as Windows Service
# Check Services app or use command:
Get-Service MongoDB | Start-Service

# Or manually:
mongod
```

---

### MongoDB Atlas Connection Fails: "authentication failed"

**Problem**: Incorrect credentials or IP not whitelisted

**Solutions**:

1. **Verify Credentials**
   ```env
   # .env should have format:
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bluemantle?retryWrites=true&w=majority
   
   # Check:
   # - Username matches Database User created in Atlas
   # - Password is URL-encoded if it contains special chars
   # - Cluster name is correct
   ```

2. **Add Your IP to Atlas**
   - Go to MongoDB Atlas Dashboard
   - Click "Network Access"
   - Click "Add IP Address"
   - Add your computer's IP (or 0.0.0.0/0 for development)
   - Click "Confirm"
   - Wait up to 5 minutes for changes to take effect

3. **Test Connection**
   ```bash
   # Install mongosh if needed
   npm install -g @mongosh/cli-repl
   
   # Test connection
   mongosh "mongodb+srv://username:password@cluster.mongodb.net/bluemantle"
   ```

---

### Database Operations Hang or Timeout

**Problem**: Slow or unresponsive database

**Solutions**:

```bash
# Check connection pool size
# MongoDB defaults to 100 connections
# Increase if needed:
MONGO_URI=mongodb+srv://...?maxPoolSize=50

# Check database size
db.admin.command({ dbStats: 1 })

# Delete old/test data if accumulating
db.logs.deleteMany({ createdAt: { $lt: new Date(Date.now() - 30*24*60*60*1000) } })

# Rebuild indexes
db.users.reIndex()
db.courses.reIndex()
```

---

## 🔐 Authentication Issues

### Login Fails: "Invalid credentials"

**Problem**: Email/password combination not found or incorrect

**Solutions**:

1. **Verify User Exists**
   ```bash
   # Login to MongoDB and check
   db.users.findOne({ email: "test@example.com" })
   
   # If not found, create test user
   node seed.js  # or create manually
   ```

2. **Password Issues**
   ```javascript
   // Passwords are hashed with bcrypt
   // Cannot be compared directly
   // Must use bcrypt.compare()
   
   // To reset a user's password:
   const bcrypt = require('bcrypt');
   const hashedPassword = await bcrypt.hash('newpassword123', 12);
   db.users.updateOne(
     { email: "test@example.com" },
     { $set: { password: hashedPassword } }
   );
   ```

3. **Check Backend Logs**
   ```bash
   # View backend console output
   # Look for error messages about password/email
   ```

---

### OTP Not Sending

**Problem**: Email service not configured or failing

**Solutions**:

1. **Check Email Configuration**
   ```env
   # .env should have:
   MAIL_SERVICE=gmail
   MAIL_USER=your-email@gmail.com
   MAIL_PASS=your-app-specific-password
   ```

2. **Gmail Setup (Required)**
   - Enable 2-factor authentication on your Gmail account
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Generate app-specific password (16 characters)
   - Use that password in MAIL_PASS
   - **Note**: NOT your regular Gmail password

3. **Test Email Service**
   ```javascript
   // Add to backend for testing
   const nodemailer = require('nodemailer');
   
   const transporter = nodemailer.createTransport({
     service: process.env.MAIL_SERVICE,
     auth: {
       user: process.env.MAIL_USER,
       pass: process.env.MAIL_PASS
     }
   });
   
   // Test send
   transporter.sendMail({
     from: process.env.MAIL_USER,
     to: 'test@example.com',
     subject: 'Test',
     text: 'Test email'
   }, (err, info) => {
     if (err) console.error('Email failed:', err);
     else console.log('Email sent:', info);
   });
   ```

---

### JWT Token Invalid: "401 Unauthorized"

**Problem**: JWT token expired, invalid, or not sent

**Solutions**:

1. **Check Token in Cookies**
   ```javascript
   // Browser DevTools → Application → Cookies
   // Look for token cookie
   // It should have HttpOnly, Secure, SameSite flags
   ```

2. **Verify JWT_SECRET**
   ```bash
   # JWT_SECRET must be:
   # - At least 64 characters
   # - Consistent across server restarts
   # - Never committed to GitHub
   
   # Check current value
   echo $JWT_SECRET | wc -c  # Should show 64+
   ```

3. **Check Token Expiry**
   ```javascript
   // Decode token (without verifying) to see expiry
   const jwt = require('jsonwebtoken');
   const decoded = jwt.decode('your-token-here');
   console.log(decoded);
   // Look for 'exp' field - is it in past?
   ```

---

## 🌐 API Communication Issues

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Problem**: Frontend and backend domains don't match CORS config

**Solutions**:

1. **Check CORS_ORIGINS in Backend**
   ```env
   # Backend .env should have:
   CORS_ORIGINS=http://localhost:3001  # for development
   # Or
   CORS_ORIGINS=https://bluemantle.com  # for production
   ```

2. **Verify Frontend URL Matches**
   ```bash
   # Check what your frontend is sending
   # Browser DevTools → Network → (any API request)
   # Look at "Request Headers" → Origin
   
   # Should match CORS_ORIGINS exactly
   ```

3. **Restart Backend After Changing .env**
   ```bash
   # CORS_ORIGINS is read at startup
   # Must restart for changes to take effect
   npm start
   ```

4. **Check Credentials Setting**
   ```javascript
   // Frontend apiRequest should include credentials
   fetch(url, {
     method: 'GET',
     credentials: 'include'  // ← Important!
   })
   ```

---

### API Returns 404: "Cannot POST /api/courses"

**Problem**: Route not registered or wrong URL

**Solutions**:

1. **Check Route Registration**
   ```javascript
   // server.js should have:
   const courseRoutes = require('./routes/courses');
   app.use('/api/courses', courseRoutes);
   
   // Check that all required routes are registered
   ```

2. **Verify Endpoint Path**
   ```bash
   # Frontend should call:
   /api/courses  # ✅
   # NOT:
   /courses      # ❌
   # NOT:
   api/courses   # ❌
   ```

3. **Check HTTP Method**
   ```javascript
   // Routes must match HTTP method
   router.GET('/') // GET /api/courses
   router.POST('/') // POST /api/courses
   
   // Frontend must use correct method
   const res = await apiRequest('/courses'); // Default GET
   const res = await apiRequest('/courses', { method: 'POST' }); // POST
   ```

---

## 🎨 Frontend Issues

### Page Shows "404: This page could not be found"

**Problem**: Route doesn't exist in Next.js App Router

**Solutions**:

1. **Check File Structure**
   ```
   src/app/page.tsx                    → /
   src/app/student/page.tsx            → /student
   src/app/student/course/page.tsx     → /student/course
   src/app/student/course/[id].tsx     → /student/course/:id
   ```

2. **Verify File Exists**
   ```bash
   # For route /student/course/123
   # File should be at:
   src/app/student/course/[id]/page.tsx
   # NOT:
   src/app/student/course/page.tsx
   ```

---

### Styles Not Loading: "Page shows unstyled content"

**Problem**: Tailwind CSS not configured or not recompiling

**Solutions**:

1. **Check Tailwind Config**
   ```javascript
   // tailwind.config.ts should have:
   export default {
     content: [
       './src/app/**/*.{js,ts,jsx,tsx}',
       './src/components/**/*.{js,ts,jsx,tsx}',
     ],
   };
   ```

2. **Check Global CSS**
   ```css
   /* src/styles/globals.css should import Tailwind */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. **Restart Dev Server**
   ```bash
   # Tailwind needs to recompile when files change
   # If styles not updating:
   npm run dev
   ```

4. **Clear Cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

---

### Components Not Rendering: "Blank Page"

**Problem**: Component error or unhandled exception

**Solutions**:

1. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red error messages
   - Error should explain the issue

2. **Common Component Issues**
   ```javascript
   // ❌ Server component trying to use browser APIs
   'use client'; // Missing this?
   export function MyComponent() {
     useEffect(() => {
       window.location  // ← Needs 'use client'
     });
   }
   
   // ❌ Missing async keyword
   export default async function Page() {
     const data = await fetch('/api/courses')  // ← Needs async
     return <div>{data}</div>
   }
   ```

---

## ⚡ Performance Issues

### Frontend Slow: Pages Take 5+ Seconds to Load

**Problem**: Large bundle, slow API, or unoptimized rendering

**Solutions**:

1. **Check Bundle Size**
   ```bash
   npm run build
   # Check output - look for large chunks
   ```

2. **Check Network Tab**
   - DevTools → Network
   - See which requests are slowest
   - Check API response time vs download size

3. **Optimize Images**
   ```typescript
   // Use Next.js Image component
   import Image from 'next/image';
   
   <Image
     src="/course-thumbnail.jpg"
     alt="Course"
     width={300}
     height={200}
     priority  // For above-fold images
   />
   ```

4. **Enable Caching**
   ```javascript
   // next.config.js
   export default {
     onDemandEntries: {
       maxInactiveAge: 60 * 1000,
       pagesBufferLength: 5,
     },
   };
   ```

---

### Backend Slow: API Calls Take 5+ Seconds

**Problem**: Database queries slow or no indexes

**Solutions**:

1. **Check Database Indexes**
   ```bash
   # Connect to MongoDB
   mongosh
   use bluemantle
   
   # Check indexes
   db.users.getIndexes()
   db.courses.getIndexes()
   
   # Create missing indexes
   db.users.createIndex({ email: 1 })
   db.courses.createIndex({ instructor: 1 })
   ```

2. **Query Optimization**
   ```javascript
   // ❌ Slow: fetching all fields
   const courses = await Course.find();
   
   // ✅ Fast: only needed fields
   const courses = await Course.find().select('title instructor -_id').lean();
   ```

3. **Enable Monitoring**
   ```javascript
   // Log slow queries
   mongoose.connection.on('open', () => {
     mongoose.set('debug', (collection, method, query) => {
       console.log(`${collection}.${method}`, query);
     });
   });
   ```

---

## 🆘 Zoom Integration Issues

### Zoom Meeting Won't Load: "Invalid meeting ID"

**Problem**: Zoom credentials not configured or invalid

**Solutions**:

1. **Verify Zoom Credentials**
   ```env
   # .env should have both OAuth AND SDK credentials
   ZOOM_CLIENT_ID=your_oauth_client_id
   ZOOM_CLIENT_SECRET=your_oauth_secret
   SDK_ID=your_meeting_sdk_id
   SDK_SECRET=your_meeting_sdk_secret
   ZOOM_ACCOUNT_ID=your_account_id
   ```

2. **Get Correct Credentials**
   - OAuth: [Zoom App Marketplace](https://marketplace.zoom.com/)
   - Meeting SDK: [Zoom Developer Dashboard](https://developers.zoom.us/)
   - These are DIFFERENT apps - both required

3. **Test Meeting Creation**
   ```javascript
   // Test endpoint that creates meetings
   POST /api/classes
   {
     "title": "Test Class",
     "scheduledAt": "2026-05-20T10:00:00Z"
   }
   
   // Check response for zoomMeetingId
   ```

---

### "Signature token expired" Zoom Error

**Problem**: Zoom token generation timing issue

**Solutions**:

1. **Check Server Time**
   ```bash
   # Zoom tokens are time-sensitive
   # Verify server time is correct
   date  # on Linux/Mac
   wmic os get localdatetime  # on Windows
   ```

2. **Sync Clock**
   ```bash
   # On Linux/Mac
   sudo ntpdate -s time.nist.gov
   
   # On Windows
   # Settings → Time & Language → Sync now
   ```

3. **Increase Token Expiry**
   ```javascript
   // Zoom tokens default to 1 hour
   // Can extend to longer if needed
   const tokenExpire = Math.floor(Date.now() / 1000) + (2 * 60 * 60); // 2 hours
   ```

---

## 📊 Deployment Issues

### "502 Bad Gateway" in Production

**Problem**: Backend server is down or not responding

**Solutions**:

1. **Check Backend Health**
   ```bash
   # SSH into server and check
   pm2 list
   pm2 logs bluemantle-api
   
   # Or check with curl
   curl https://api.bluemantle.com/
   ```

2. **Restart Backend**
   ```bash
   pm2 restart bluemantle-api
   # or
   pm2 restart all
   ```

3. **Check Resources**
   ```bash
   # Check memory/CPU usage
   pm2 monit
   
   # If out of memory, increase:
   pm2 restart bluemantle-api --max-memory-restart 500M
   ```

---

### Frontend Shows Blank Page After Deployment

**Problem**: Build failed or wrong environment variables

**Solutions**:

1. **Check Build Logs**
   - Vercel: go to Deployments → select failed → click Build
   - Netlify: go to Deploys → click failed deploy
   - Look for error messages

2. **Verify Environment Variables**
   ```bash
   # Make sure NEXT_PUBLIC_API_URL is set correctly
   echo $NEXT_PUBLIC_API_URL
   
   # Should be production backend URL
   https://api.bluemantle.com/api
   ```

3. **Check Network Tab**
   - DevTools → Network
   - See if API calls are going to correct URL
   - Check for 404 or CORS errors

---

## 📝 Logging & Debugging

### Enable Debug Mode

```bash
# Backend
DEBUG=bluemantle:* npm start

# Frontend  
DEBUG=* npm run dev
```

### View Logs

```bash
# Backend logs
pm2 logs bluemantle-api
pm2 logs bluemantle-api --err  # Errors only
pm2 logs bluemantle-api --lines 100  # Last 100 lines

# Frontend build output
npm run build 2>&1 | tee build.log
```

---

## 🤔 Still Having Issues?

1. **Check all documentation**:
   - [README.md](./README.md) - Overview
   - [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Setup steps
   - [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Coding standards
   - [SECURITY.md](./SECURITY.md) - Security features

2. **Enable verbose logging** to understand what's happening

3. **Search GitHub Issues** for similar problems

4. **Contact Support**:
   - Email: support@bluemantle.com
   - Include error message, steps to reproduce, and environment info

---

## 💡 Pro Tips

- Always check `.env` variables first
- Restart services after config changes
- Clear cache frequently during development
- Check logs before searching for solutions
- Use browser DevTools Network tab to debug API issues
- Keep npm and Node.js updated

Good luck! 🚀

