# Bluemantle - Premium eLearning Platform

Bluemantle is a sophisticated, security-first eLearning platform designed to deliver premium educational content while maintaining strict control over intellectual property. Built with modern technologies and enterprise-grade security features.

## 🎯 Overview

Bluemantle is a comprehensive Learning Management System (LMS) that combines:
- **Secure Video Delivery**: Unlisted YouTube videos integrated seamlessly with DRM-like protections
- **Interactive Learning**: Live classes via Zoom, recorded sessions, and student progress tracking
- **Role-Based Management**: Admin, Teacher, and Student dashboards with specialized workflows
- **Advanced Security**: Single-device enforcement, OTP verification, and anti-tampering mechanisms

### Key Features

✅ **Security-First Design**
- HTTP-only cookie-based authentication with JWT tokens
- Single device lock with OTP verification for new devices
- Developer tools and screenshot prevention on student accounts
- Content protection against unauthorized access

✅ **Complete Learning Platform**
- Live class scheduling and video conferencing (Zoom)
- Sequential video progression with completion gating
- Real-time progress analytics and attendance tracking
- Student notes and resource management

✅ **Modern Stack**
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS
- **Real-time**: Zoom SDK integration for live classes
- **Hosting**: Cloud-ready with Docker support

---

## 📁 Project Structure

```
bluemantle-elearning-platform/
├── Bluemantle-backend/          # Express.js API server
│   ├── config/                  # Database and config files
│   ├── controllers/             # Route handlers
│   ├── middleware/              # Auth, validation, error handling
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API endpoint definitions
│   ├── utils/                   # Helper functions
│   ├── validations/             # Input validation schemas
│   ├── server.js               # Entry point
│   └── package.json
│
├── Bluemantle-frontend/         # Next.js frontend application
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   ├── components/          # React components
│   │   ├── lib/                 # Utilities (API client, helpers)
│   │   ├── data/                # Static data and constants
│   │   └── styles/              # Global CSS
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
│
├── docs/                        # Documentation
├── README.md                    # This file
├── ARCHITECTURE.md              # System design and architecture
├── SETUP_GUIDE.md              # Local development setup
├── DEPLOYMENT_GUIDE.md         # Production deployment
├── API_DOCUMENTATION.md        # Backend API reference
├── DEVELOPMENT_GUIDE.md        # Development workflow
├── SECURITY.md                 # Security features
└── TROUBLESHOOTING.md         # Common issues and solutions
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Zoom account with SDK credentials
- YouTube unlisted channel

### Local Development

**1. Clone and setup backend**
```bash
cd Bluemantle-backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm start
```

**2. Setup frontend (in new terminal)**
```bash
cd Bluemantle-frontend
npm install
npm run dev
```

**3. Access the application**
- Frontend: http://localhost:3001
- Backend API: http://localhost:5000/api

> For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, database schema, and component overview |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Local development environment setup |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Production deployment checklist and instructions |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API endpoint reference |
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | Code conventions, project structure, and workflows |
| [SECURITY.md](./SECURITY.md) | Security features, policies, and best practices |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and solutions |

---

## 🔐 Security Highlights

Bluemantle implements enterprise-grade security:

- **Authentication**: JWT tokens + HTTP-only cookies
- **Device Lock**: Single device per user with OTP verification
- **Content Protection**: Prevents right-click, inspect, console access on student routes
- **Session Management**: Automatic logout on inactivity and concurrent login prevention
- **Data Validation**: Input validation and sanitization on all endpoints
- **CORS**: Strict origin-based access control

See [SECURITY.md](./SECURITY.md) for complete security documentation.

---

## 🛠️ Development

### Running Tests
```bash
# Backend tests
cd Bluemantle-backend
npm test

# Frontend tests
cd Bluemantle-frontend
npm test
```

### Building for Production
```bash
# Backend
cd Bluemantle-backend
npm start

# Frontend
cd Bluemantle-frontend
npm run build
npm start
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  Login │ Student Dashboard │ Teacher Dashboard │ Live Class │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/API
                     │
┌────────────────────▼────────────────────────────────────────┐
│              BACKEND (Express.js)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │    Auth     │  │   Content    │  │   Live Classes     │ │
│  │  (JWT/OTP)  │  │  Management  │  │   (Zoom SDK)       │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   MongoDB      Zoom SDK      YouTube API
     Atlas      (Live)        (Videos)
```

---

## 🤝 Contributing

1. Create a feature branch from `main`
2. Follow the conventions in [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
3. Test thoroughly and update documentation
4. Submit a pull request with a clear description

---

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/bluemantle
JWT_SECRET=your-64-character-secret-key
FRONTEND_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3001

# Zoom
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
SDK_ID=your_zoom_sdk_id
SDK_SECRET=your_zoom_sdk_secret

# YouTube
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CHANNEL_ID=your_youtube_channel_id
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🐛 Common Issues

- **MongoDB Connection Fails**: Check MONGO_URI in .env and whitelist IP
- **Zoom Not Working**: Verify SDK credentials and meeting ID format
- **API CORS Errors**: Ensure FRONTEND_URL matches your actual frontend URL
- **Login Issues**: Clear cookies and check JWT_SECRET length (min 64 chars)

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more detailed solutions.

---

## 📞 Support & Maintenance

For issues, questions, or feature requests, please refer to:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common problems and solutions
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Technical guidelines
- Backend logs: `./Bluemantle-backend/.env`
- Frontend logs: Browser console and `./Bluemantle-frontend/.next`

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

## ✨ Last Updated

**Date**: May 2026  
**Status**: Stable with React 19 & Next.js 16.2.6  
**Frontend**: Running on port 3001  
**Backend**: Ready for local development on port 5000

