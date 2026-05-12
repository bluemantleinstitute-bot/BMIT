# Bluemantle Local Development Setup Guide

Complete instructions for setting up Bluemantle for local development.

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **MongoDB** - Either:
  - Local: [MongoDB Community Edition](https://docs.mongodb.com/manual/installation/)
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (recommended)
- **Git** - For cloning the repository
- **Zoom Account** - For Zoom SDK credentials
- **YouTube Channel** - For unlisted videos
- **Email Service** - For OTP notifications (Gmail, SendGrid, etc.)

---

## 🚀 Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/bluemantle-elearning-platform.git
cd bluemantle-elearning-platform
```

---

## ⚙️ Step 2: Backend Setup

### 2.1 Navigate to Backend Directory
```bash
cd Bluemantle-backend
```

### 2.2 Copy Environment Template
```bash
cp .env.example .env
```

### 2.3 Configure Environment Variables

Edit `.env` with your actual values:

```env
# ========== CORE ==========
NODE_ENV=development
PORT=5000

# ========== DATABASE ==========
# Option A: Local MongoDB
MONGO_URI=mongodb://localhost:27017/bluemantle

# Option B: MongoDB Atlas (Cloud)
# Get URI from: https://www.mongodb.com/cloud/atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bluemantle?retryWrites=true&w=majority

# ========== AUTHENTICATION ==========
JWT_SECRET=your-super-secret-key-at-least-64-characters-long-for-security

# ========== FRONTEND ==========
FRONTEND_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3001

# ========== ZOOM SDK ==========
# Get from: https://developers.zoom.com/
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
SDK_ID=your_zoom_meeting_sdk_id
SDK_SECRET=your_zoom_meeting_sdk_secret

# ========== YOUTUBE API ==========
# Get from: https://console.cloud.google.com/
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CHANNEL_ID=your_youtube_unlisted_channel_id

# ========== EMAIL SERVICE (Optional for OTP) ==========
MAIL_SERVICE=gmail
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-specific-password
```

### 2.4 Install Dependencies
```bash
npm install
```

### 2.5 Verify Installation
```bash
npm start
```

Expected output:
```
🚀 Server running on http://localhost:5000
📊 Connected to MongoDB
```

**Note**: Keep the server running in this terminal.

---

## 🎨 Step 3: Frontend Setup

### 3.1 Open New Terminal Window

In a new terminal (keep backend running in first terminal):

```bash
cd Bluemantle-frontend
```

### 3.2 Install Dependencies
```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required due to React 19 peer dependency changes.

### 3.3 Create Environment File
```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:5000/api' > .env.local
```

### 3.4 Start Development Server
```bash
npm run dev
```

Expected output:
```
▲ Next.js 16.2.6 (Turbopack)
- Local:         http://localhost:3001
- Network:       http://your-ip:3001
✓ Ready in 321ms
```

---

## ✅ Step 4: Verify Setup

### 4.1 Test Backend Health Check
```bash
curl http://localhost:5000/
# Expected: "API running..."
```

### 4.2 Test Frontend
Open browser and navigate to: `http://localhost:3001`

You should see the login page with:
- Bluemantle logo
- Email/User ID field
- Password field
- Sign In button

### 4.3 Test API Connection
```bash
curl http://localhost:5000/api/courses \
  -H "Content-Type: application/json"
# Should return courses list (may be empty initially)
```

---

## 📊 Step 5: Initialize Sample Data (Optional)

### 5.1 Backend Scripts

The backend includes helpful utility scripts:

```bash
cd Bluemantle-backend

# Seed database with sample users and courses
npm run seed

# Or run specific setup
node seed_dashboard.js
```

### 5.2 Create Test Users

```bash
node rebuild_system.js
```

This creates test accounts:
- **Admin**: `admin@bluemantle.com` / `password123`
- **Teacher**: `teacher@bluemantle.com` / `password123`
- **Student**: `student@bluemantle.com` / `password123`

---

## 🔧 Step 6: Configure External Services

### 6.1 Zoom SDK Setup

1. Go to [Zoom Developer Console](https://developers.zoom.us/)
2. Create an OAuth app
3. Copy these credentials to `.env`:
   - `ZOOM_CLIENT_ID`
   - `ZOOM_CLIENT_SECRET`
   - `ZOOM_ACCOUNT_ID`

For Meeting SDK:
1. Go to Meeting SDK section
2. Create a new SDK app
3. Copy `SDK_ID` and `SDK_SECRET`

### 6.2 YouTube Channel Setup

1. Create an unlisted YouTube channel or use existing
2. Go to [Google Cloud Console](https://console.cloud.google.com/)
3. Create a new project
4. Enable YouTube Data API v3
5. Create API key and add to `.env`

### 6.3 Email Service (For OTP)

Using Gmail:
1. Enable 2-factor authentication
2. Generate app-specific password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Add credentials to `.env`

---

## 📁 Project File Structure

After successful setup, your directory should look like:

```
bluemantle-elearning-platform/
├── Bluemantle-backend/
│   ├── .env (with your credentials)
│   ├── node_modules/
│   ├── src/
│   └── package.json
│
├── Bluemantle-frontend/
│   ├── .env.local
│   ├── node_modules/
│   ├── src/
│   └── package.json
│
└── README.md
```

---

## 🗄️ Database Setup

### Using MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a new project
4. Create a cluster (M0 free tier is fine for development)
5. Go to "Database Access" → Create a database user
6. Go to "Network Access" → Add your IP (or 0.0.0.0/0 for development)
7. Click "Connect" and copy connection string
8. Replace `<password>` with your user password
9. Add to `.env` as `MONGO_URI`

### Using Local MongoDB

**Mac (with Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
- Download [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
- Follow installation wizard
- MongoDB runs as Windows Service

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

Then set in `.env`:
```env
MONGO_URI=mongodb://localhost:27017/bluemantle
```

---

## 🧪 Development Workflow

### Terminal 1: Backend
```bash
cd Bluemantle-backend
npm start
```

### Terminal 2: Frontend
```bash
cd Bluemantle-frontend
npm run dev
```

### Terminal 3: Optional - MongoDB GUI
```bash
# Install MongoDB Compass (GUI tool)
# or use command line:
mongosh
```

---

## 🐛 Common Setup Issues

### Issue: "Cannot find module '@react-three/fiber'"
**Solution**: Run in frontend directory:
```bash
npm install --legacy-peer-deps
```

### Issue: "MongoDB connection refused"
**Solution**: 
- If using local MongoDB: `brew services start mongodb-community` (Mac)
- If using Atlas: Check IP whitelist in Network Access settings
- Verify `MONGO_URI` format in `.env`

### Issue: "Zoom SDK credentials invalid"
**Solution**:
- Double-check `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET`
- Ensure SDK app is created (separate from OAuth app)
- Verify credentials match the app you're testing with

### Issue: "CORS error when calling API"
**Solution**:
- Verify `FRONTEND_URL` in backend `.env` matches exactly
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Restart both servers after changing environment variables

### Issue: "OTP not being sent"
**Solution**:
- Enable "Less secure app access" in Gmail settings
- Use app-specific password (2FA required)
- Check email service credentials in `.env`

---

## 📚 Next Steps

After successful setup:

1. **Read the Documentation**:
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand system design
   - [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Coding standards
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoints

2. **Explore the Code**:
   - Frontend: `Bluemantle-frontend/src/`
   - Backend: `Bluemantle-backend/`

3. **Try Key Workflows**:
   - Login with test user
   - Browse courses
   - Join a live class
   - Watch a video

4. **Start Development**:
   - Create feature branches
   - Follow coding conventions
   - Write tests
   - Submit pull requests

---

## 🚀 Running Different Environments

### Development (Current)
```bash
# Backend
NODE_ENV=development npm start

# Frontend  
npm run dev
```

### Production Build
```bash
# Backend
NODE_ENV=production npm start

# Frontend
npm run build
npm start
```

### Testing
```bash
# Backend tests
npm test

# Frontend tests
npm test
```

---

## 📖 Useful Commands

```bash
# Backend
npm start              # Start server
npm test              # Run tests
node seed.js          # Seed database
npm run lint          # Lint code

# Frontend
npm run dev           # Start dev server
npm run build         # Build for production
npm run lint          # Lint code
npm test              # Run tests
```

---

## 💻 IDE Setup Recommendations

### VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- MongoDB for VS Code
- Thunder Client (API testing)
- Prettier (code formatter)

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## ✨ You're All Set!

Your development environment is now ready. Start by:

1. Opening `http://localhost:3001` in your browser
2. Logging in with test credentials (if seeded)
3. Exploring the application
4. Reading the codebase
5. Making your first changes

For questions, refer to:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- Existing code documentation

Happy coding! 🚀

