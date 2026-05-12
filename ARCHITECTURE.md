# Bluemantle Architecture

This document provides a comprehensive overview of Bluemantle's system architecture, including design patterns, data models, and component interactions.

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        Next.js 16.2.6 Frontend (React 19)               │   │
│  │  - Server Components & Client Components                │   │
│  │  - Tailwind CSS Styling                                 │   │
│  │  - Real-time State Management                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              APPLICATION LAYER (Backend)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐│
│  │   Express    │ │  Controllers │ │   Routes & Middleware   ││
│  │   Server     │ │  (Business   │ │  - Auth Validation       ││
│  │              │ │   Logic)     │ │  - Error Handling        ││
│  └──────────────┘ └──────────────┘ │  - CORS & Security      ││
│                                    └──────────────────────────┘│
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│             DATA LAYER (Persistence)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         MongoDB Atlas (Cloud Database)                   │   │
│  │  - User Models    - Course Models    - Class Models      │   │
│  │  - Progress Tracking                                     │   │
│  │  - Attendance Records                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

                    EXTERNAL SERVICES
┌────────────────────────────────────────────────────────────────┐
│  Zoom SDK       │    YouTube API      │   Email Service       │
│  (Live Classes) │    (Video Content)  │   (Notifications)     │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### User Model
```javascript
User {
  _id: ObjectId
  email: String (unique)
  password: String (hashed with bcrypt)
  firstName: String
  lastName: String
  role: "student" | "teacher" | "admin" | "owner"
  dateOfBirth: Date
  phoneNumber: String
  profileImage: String (URL)
  
  // Security
  deviceHash: String (device fingerprint)
  allowedDevices: [String]
  lastLoginAt: Date
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

### Course Model
```javascript
Course {
  _id: ObjectId
  title: String
  description: String
  thumbnail: String (URL)
  instructor: ObjectId (ref: User)
  category: String
  level: "beginner" | "intermediate" | "advanced"
  
  // Content
  modules: [{
    _id: ObjectId
    title: String
    description: String
    videos: [ObjectId] (ref: Video)
    order: Number
  }]
  
  // Metadata
  totalStudents: Number
  totalDuration: Number (minutes)
  isPublished: Boolean
  createdAt: Date
  updatedAt: Date
}
```

### Video Model
```javascript
Video {
  _id: ObjectId
  courseId: ObjectId (ref: Course)
  title: String
  description: String
  youtubeVideoId: String (unlisted)
  duration: Number (seconds)
  moduleId: ObjectId
  order: Number
  
  // Access Control
  allowedRoles: ["student", "teacher"]
  requiresCompletion: Boolean
  
  // Tracking
  viewCount: Number
  averageWatchTime: Number
  createdAt: Date
  updatedAt: Date
}
```

### Progress Model
```javascript
Progress {
  _id: ObjectId
  userId: ObjectId (ref: User)
  courseId: ObjectId (ref: Course)
  
  // Tracking
  completedVideos: [ObjectId]
  currentVideoId: ObjectId
  completionPercentage: Number
  
  // Timestamps
  startedAt: Date
  lastAccessedAt: Date
  completedAt: Date (null if not completed)
}
```

### LiveClass Model
```javascript
LiveClass {
  _id: ObjectId
  title: String
  description: String
  instructor: ObjectId (ref: User)
  course: ObjectId (ref: Course)
  
  // Zoom Integration
  zoomMeetingId: String
  zoomPassword: String
  zoomStartUrl: String
  zoomJoinUrl: String
  
  // Schedule
  scheduledAt: Date
  duration: Number (minutes)
  status: "scheduled" | "live" | "completed"
  
  // Recording
  recordingUrl: String
  recordingPassword: String
  
  // Participants
  attendees: [{
    userId: ObjectId
    joinedAt: Date
    leftAt: Date
  }]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}
```

### Attendance Model
```javascript
Attendance {
  _id: ObjectId
  userId: ObjectId (ref: User)
  classId: ObjectId (ref: LiveClass)
  
  // Status
  status: "present" | "late" | "absent"
  markedAt: Date
  
  // Recording Access
  watchedRecordingAt: Date
  watchedDuration: Number (minutes)
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔐 Authentication & Security Flow

### Login Flow
```
1. User submits credentials
   ↓
2. Backend validates credentials
   ↓
3. Device fingerprint check
   ├─ NEW DEVICE → Generate OTP → Send via email
   └─ KNOWN DEVICE → Generate JWT
   ↓
4. Return JWT token + HTTP-only cookie
   ↓
5. Frontend stores token for API requests
   ↓
6. Subsequent requests include Authorization header
```

### OTP Verification Flow
```
1. New device login attempt
   ↓
2. OTP sent to user's registered email
   ↓
3. User enters 6-digit code
   ↓
4. Backend validates OTP (valid for 10 minutes)
   ↓
5. Device added to allowedDevices array
   ↓
6. JWT token issued
```

### Single Device Lock
```
User Login
  ↓
Check deviceHash against allowedDevices
  ├─ Device in list → Allow login
  └─ Device NOT in list → Require OTP
         ↓
    Device added after OTP verification
         ↓
    Only this device can access account
         ↓
    Login from new device auto-logs out previous session
```

---

## 📡 API Structure

### Authentication Routes (`/api/auth`)
- `POST /login` - User login with email/password
- `POST /verify-otp` - Verify OTP for new device
- `POST /logout` - Logout current session
- `POST /refresh-token` - Refresh JWT token

### Course Routes (`/api/courses`)
- `GET /` - List all courses
- `GET /:id` - Get course details with progress
- `GET /:id/modules` - Get course modules
- `POST /` - Create course (admin/teacher only)
- `PUT /:id` - Update course (owner only)
- `DELETE /:id` - Delete course (owner only)

### Video Routes (`/api/videos`)
- `GET /:videoId` - Get video details
- `POST /:videoId/watch-start` - Record video watch start
- `POST /:videoId/watch-end` - Record video watch completion
- `GET /:videoId/progress` - Get user's watch progress

### Live Class Routes (`/api/classes`)
- `GET /` - List upcoming classes
- `GET /:id` - Get class details
- `POST /` - Create class (teacher/admin)
- `POST /:id/join` - Join class (returns Zoom token)
- `GET /:id/attendance` - Get attendance records
- `POST /:id/attendance/mark` - Mark attendance

### Progress Routes (`/api/progress`)
- `GET /courses/:courseId` - Get course progress
- `GET /dashboard` - Get aggregated dashboard data
- `PUT /courses/:courseId/complete` - Mark course complete

---

## 🔄 Component Interaction Patterns

### Server-Side Rendering (SSR)
- Layout components load user data on server
- Authenticated API calls made server-to-server (no CORS issues)
- Metadata rendered directly in HTML

### Client-Side Updates
- Real-time progress tracking
- Interactive video player controls
- Form submissions with optimistic updates
- WebSocket connections for live class notifications

### API Communication Pattern
```typescript
// Frontend client utility (apiRequest)
const response = await apiRequest('/api/courses', {
  method: 'GET',
  credentials: 'include' // Auto-sends HTTP-only cookies
});
```

---

## 🎯 Key Design Decisions

### 1. **JWT + HTTP-Only Cookies**
- **Why**: Prevents XSS attacks while maintaining secure session management
- **Implementation**: JWT stored in HTTP-only cookie, automatically sent with requests
- **Fallback**: Authorization header for non-cookie scenarios

### 2. **Sequential Video Gating**
- **Why**: Ensures students complete content in order
- **Implementation**: Server-side validation before allowing video access
- **Enforcement**: Cannot skip ahead; must complete N-1 before N

### 3. **Device Fingerprinting**
- **Why**: Prevents multi-device concurrent access
- **Implementation**: Combination of User-Agent, hardware info, timezone
- **Flexibility**: Admin can whitelist additional devices for user

### 4. **MongoDB for Flexibility**
- **Why**: Easy schema evolution for feature additions
- **Implementation**: Mongoose schemas with validation
- **Trade-off**: Requires careful data consistency management

### 5. **Zoom SDK for Video Conferencing**
- **Why**: Enterprise-grade, reliable, with recording built-in
- **Implementation**: Server generates meeting tokens with expiration
- **Security**: Tokens valid only for authenticated users

---

## 🚀 Scalability Considerations

### Current State
- Single MongoDB instance
- Monolithic Express server
- Synchronous processing for most operations

### Future Improvements
1. **Microservices**: Separate services for auth, content, classes
2. **Message Queue**: Redis/RabbitMQ for async notifications
3. **Caching Layer**: Redis for frequently accessed data
4. **CDN**: CloudFront for video delivery
5. **Load Balancing**: Multiple backend instances behind load balancer

### Database Optimization
- Indexes on frequently queried fields
- Document denormalization for performance
- Separate collections for analytics data

---

## 🔄 Data Flow Examples

### Student Starting a Course
```
1. Student clicks "Start Course"
   ↓
2. Frontend requests: GET /api/courses/:id
   ↓
3. Backend:
   - Validates user authentication
   - Fetches course with modules
   - Calculates progress percentage
   - Returns course data
   ↓
4. Frontend displays first module
   ↓
5. Student clicks video
   ↓
6. Backend validates:
   - User enrolled in course
   - Previous videos completed
   - Device authorized
   ↓
7. Returns embedded YouTube player
```

### Teacher Creating Live Class
```
1. Teacher fills class form
   ↓
2. Frontend submits: POST /api/classes
   ↓
3. Backend:
   - Validates teacher is authenticated
   - Creates class record
   - Calls Zoom API to create meeting
   - Stores Zoom credentials
   - Returns meeting ID and URL
   ↓
4. Frontend shows join link
   ↓
5. Class scheduled for students to join
```

---

## 📈 Performance Characteristics

| Operation | Expected Time |
|-----------|---------------|
| User login | < 500ms |
| Course list fetch | < 1s |
| Video page load | < 2s |
| Attendance mark | < 200ms |
| Progress update | < 300ms |

---

## 🛡️ Security Architecture

```
┌─ FRONTEND SECURITY
│  ├─ HTTPS only
│  ├─ CSP headers
│  ├─ No dev tools on student routes
│  └─ Screenshot prevention
│
├─ NETWORK SECURITY
│  ├─ CORS whitelist
│  ├─ Rate limiting
│  └─ HTTPS/TLS
│
└─ BACKEND SECURITY
   ├─ Input validation
   ├─ JWT verification
   ├─ Device authentication
   ├─ Password hashing (bcrypt)
   └─ SQL/NoSQL injection prevention
```

---

## 📚 Related Documentation

- [SECURITY.md](./SECURITY.md) - Detailed security features
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Development conventions

