# Bluemantle Development Guide

Guidelines for contributing to the Bluemantle project, including code standards, conventions, and workflows.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Code Standards](#code-standards)
3. [File Structure](#file-structure)
4. [Naming Conventions](#naming-conventions)
5. [Git Workflow](#git-workflow)
6. [Backend Development](#backend-development)
7. [Frontend Development](#frontend-development)
8. [Testing](#testing)
9. [Documentation](#documentation)

---

## 🚀 Getting Started

1. Clone the repository
2. Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) for local setup
3. Create a feature branch from `main`
4. Make changes following these guidelines
5. Test thoroughly
6. Submit a pull request

---

## 🎯 Code Standards

### General Principles

- **Readability**: Code should be self-documenting
- **Simplicity**: Avoid over-engineering; keep it simple
- **Consistency**: Follow existing patterns in the codebase
- **Security**: Never compromise on security for convenience
- **Performance**: Consider performance implications

### JavaScript/TypeScript Standards

```javascript
// ✅ Good: Descriptive names, clear logic
const calculateUserProgress = (completedVideos, totalVideos) => {
  return (completedVideos / totalVideos) * 100;
};

// ❌ Avoid: Unclear abbreviations, magic numbers
const cp = (c, t) => (c / t) * 100;

// ✅ Good: Explicit error handling
try {
  const result = await fetchCourse(courseId);
  return result;
} catch (error) {
  logger.error('Failed to fetch course:', error);
  throw new Error('Course fetch failed');
}

// ❌ Avoid: Silent failures
const result = await fetchCourse(courseId).catch(() => null);
```

### Formatting

- **Indentation**: 2 spaces (not tabs)
- **Line Length**: Max 100 characters
- **Semicolons**: Required
- **Quotes**: Double quotes for strings
- **Trailing Commas**: Use in multi-line objects/arrays

Use Prettier for automatic formatting:
```bash
npm run format
```

### Imports/Exports

```javascript
// ✅ Good: Consistent import style
import { Controller } from '@nestjs/common';
import { userService } from '../services/user';
import type { User } from '../types';

// ❌ Avoid: Mixing import styles
const { Controller } = require('@nestjs/common');
import userService from '../services/user';
```

---

## 📁 File Structure

### Backend Organization

```
Bluemantle-backend/
├── config/              # Configuration files
│   └── database.js
├── controllers/         # Request handlers
│   ├── authController.js
│   ├── courseController.js
│   └── classController.js
├── middleware/          # Express middleware
│   ├── auth.js
│   ├── validation.js
│   └── errorHandler.js
├── models/              # MongoDB schemas
│   ├── User.js
│   ├── Course.js
│   └── LiveClass.js
├── routes/              # Route definitions
│   ├── auth.js
│   ├── courses.js
│   └── classes.js
├── utils/               # Helper functions
│   ├── jwt.js
│   ├── email.js
│   └── validation.js
├── validations/         # Request validation schemas
│   ├── loginSchema.js
│   └── courseSchema.js
├── server.js            # Entry point
└── package.json
```

### Frontend Organization

```
Bluemantle-frontend/src/
├── app/                 # Next.js App Router
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Login page
│   ├── student/         # Student routes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── course/
│   ├── teacher/         # Teacher routes
│   └── admin/           # Admin routes
├── components/          # Reusable components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── KnowledgeCard.tsx
├── lib/                 # Utilities and helpers
│   ├── api.ts          # API client
│   ├── utils.ts        # Helper functions
│   └── constants.ts    # Constants
├── data/               # Static data
│   └── navigation.ts
└── styles/             # Global styles
    └── globals.css
```

---

## 📝 Naming Conventions

### Variables & Functions

```javascript
// ✅ Good: Clear, descriptive names
const userEmail = "student@bluemantle.com";
const calculateTotalProgress = () => {};
const isUserAuthenticated = true;

// ❌ Avoid: Ambiguous or single-letter names (except in loops)
const ue = "student@bluemantle.com";
const calc = () => {};
const auth = true;
```

### Files & Folders

```
// ✅ Good naming
- userController.js
- courseSchema.js
- authMiddleware.js
- LoginForm.tsx
- UserProfile.tsx

// ❌ Avoid
- user.js (too generic)
- schema.js (unclear what schema)
- middleware.js (which middleware?)
- loginform.tsx (lowercase)
- userprofile.tsx (inconsistent casing)
```

### Constants

```javascript
// ✅ Good: UPPER_SNAKE_CASE for constants
const JWT_EXPIRY = '24h';
const MAX_LOGIN_ATTEMPTS = 5;
const COURSE_COMPLETION_THRESHOLD = 0.8;

// ❌ Avoid
const jwtExpiry = '24h';
const max_login_attempts = 5;
```

### Database Fields

```javascript
// ✅ Good: camelCase in code, snake_case in DB
// Model
const userSchema = {
  firstName: String,  // Code
  lastName: String,
};

// Database stores as: first_name, last_name (if mapped)
```

---

## 🌳 Git Workflow

### Branch Naming

```
feature/add-live-class-scheduling
feature/implement-otp-verification
bugfix/fix-progress-calculation
docs/update-api-documentation
refactor/simplify-auth-middleware
```

### Commit Messages

```
# ✅ Good: Clear, descriptive, present tense
git commit -m "Add OTP verification for new devices"
git commit -m "Fix progress calculation logic"
git commit -m "Update API documentation"

# ❌ Avoid
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "update"
```

### Pull Request Process

1. Create feature branch from `main`
2. Make focused changes
3. Test thoroughly
4. Update documentation
5. Submit PR with clear description
6. Request review from team members
7. Address review comments
8. Merge after approval

### PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed

## Screenshots (if UI change)
Include relevant screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Tests pass
```

---

## 🔧 Backend Development

### Creating a New API Endpoint

**1. Define Route** (`routes/courses.js`):
```javascript
const express = require('express');
const courseController = require('../controllers/courseController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', courseController.listCourses);
router.post('/', auth, courseController.createCourse);
router.get('/:id', courseController.getCourse);

module.exports = router;
```

**2. Create Controller** (`controllers/courseController.js`):
```javascript
exports.listCourses = async (req, res, next) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    // Validate input
    const { title, description } = req.body;
    
    // Check authorization
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Create course
    const course = new Course({
      title,
      description,
      instructor: req.user._id
    });
    
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};
```

**3. Add Validation** (`validations/courseSchema.js`):
```javascript
const schema = {
  createCourse: {
    title: { type: String, required: true, minLength: 3 },
    description: { type: String, required: true, minLength: 10 }
  }
};

module.exports = schema;
```

**4. Register Route** (`server.js`):
```javascript
const courseRoutes = require('./routes/courses');
app.use('/api/courses', courseRoutes);
```

### Error Handling

Always use try-catch with next(error):

```javascript
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    next(error); // Pass to error middleware
  }
};
```

---

## 🎨 Frontend Development

### Creating a New Component

**File**: `src/components/CourseCard.tsx`

```typescript
'use client';

import React from 'react';
import Link from 'next/link';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  progress?: number;
}

export function CourseCard({
  id,
  title,
  description,
  thumbnail,
  progress = 0
}: CourseCardProps) {
  return (
    <div className="rounded-lg border border-outline_variant p-4 hover:shadow-lg transition-shadow">
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}
      
      <h3 className="text-xl font-bold text-on_surface mb-2">{title}</h3>
      <p className="text-on_surface_variant text-sm mb-4">{description}</p>
      
      {progress > 0 && (
        <div className="mb-4">
          <div className="w-full bg-surface_variant rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-on_surface_variant">{progress}% complete</span>
        </div>
      )}
      
      <Link
        href={`/student/course/${id}`}
        className="inline-block bg-primary text-on_primary px-4 py-2 rounded-lg font-bold hover:bg-primary_container transition-colors"
      >
        View Course
      </Link>
    </div>
  );
}
```

### Creating a New Page

**File**: `src/app/student/courses/page.tsx`

```typescript
import { Suspense } from 'react';
import { apiRequest } from '@/lib/api';
import { CourseCard } from '@/components/CourseCard';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
}

export default async function CoursesPage() {
  let courses: Course[] = [];
  
  try {
    courses = await apiRequest('/courses');
  } catch (error) {
    console.error('Failed to fetch courses:', error);
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">My Courses</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <CourseCard key={course._id} {...course} />
        ))}
      </div>
      
      {courses.length === 0 && (
        <p className="text-center text-on_surface_variant">
          No courses found. Start learning today!
        </p>
      )}
    </div>
  );
}
```

### API Calls

Use the centralized `apiRequest` utility:

```typescript
import { apiRequest } from '@/lib/api';

// GET request
const courses = await apiRequest('/courses');

// POST request
const newCourse = await apiRequest('/courses', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Advanced React',
    description: 'Learn React patterns'
  })
});

// With error handling
try {
  const result = await apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(data)
  });
} catch (error) {
  console.error('Failed:', error);
  // Handle error
}
```

---

## 🧪 Testing

### Backend Tests

```javascript
// tests/courses.test.js
const request = require('supertest');
const app = require('../server');

describe('GET /api/courses', () => {
  it('should return all courses', async () => {
    const res = await request(app)
      .get('/api/courses')
      .expect(200);
    
    expect(Array.isArray(res.body)).toBe(true);
  });
  
  it('should return 404 for non-existent course', async () => {
    await request(app)
      .get('/api/courses/invalid-id')
      .expect(404);
  });
});
```

Run tests:
```bash
npm test
```

### Frontend Component Tests

```typescript
// tests/CourseCard.test.tsx
import { render, screen } from '@testing-library/react';
import { CourseCard } from '@/components/CourseCard';

describe('CourseCard', () => {
  it('renders course title', () => {
    render(
      <CourseCard
        id="1"
        title="Test Course"
        description="Test description"
      />
    );
    
    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });
});
```

---

## 📖 Documentation

### Code Comments

- Write clear comments for complex logic
- Avoid comments for obvious code
- Keep comments updated with code

```javascript
// ✅ Good: Explains WHY, not WHAT
// Check if user completed previous video before allowing access
// This prevents students from skipping ahead in the course
if (!completedVideos.includes(previousVideoId)) {
  return res.status(403).json({ error: 'Complete previous video first' });
}

// ❌ Avoid: States obvious facts
// Check if completedVideos includes previousVideoId
if (!completedVideos.includes(previousVideoId)) {
  ...
}
```

### JSDoc Comments (for functions)

```javascript
/**
 * Calculate user's progress in a course
 * @param {string} userId - The user's ID
 * @param {string} courseId - The course ID
 * @returns {Promise<number>} Progress percentage (0-100)
 * @throws {Error} If user or course not found
 */
async function calculateProgress(userId, courseId) {
  // implementation
}
```

### README Updates

- Update relevant docs when adding features
- Document breaking changes
- Include examples for new functionality

---

## 🔒 Security Checklist

Before committing code:

- [ ] No hardcoded credentials
- [ ] Input validation on all endpoints
- [ ] Authorization checks for sensitive operations
- [ ] Password hashing (bcrypt) for user data
- [ ] HTTPS in production
- [ ] CORS properly configured
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection measures in place

---

## 📊 Performance Considerations

### Backend

- Use database indexes for frequently queried fields
- Implement pagination for large result sets
- Cache expensive computations
- Use lean() queries when full documents not needed

### Frontend

- Code split large components
- Lazy load images and components
- Minimize bundle size
- Use React.memo() for expensive renders

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code reviewed by team
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Security audit completed
- [ ] Performance tested
- [ ] Documentation updated
- [ ] Rollback plan prepared

---

## 📚 Additional Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [SECURITY.md](./SECURITY.md) - Security guidelines
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Development setup

---

## ❓ Questions?

If you have questions about:
- **Setup**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API endpoints**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Security**: See [SECURITY.md](./SECURITY.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

Happy coding! 🚀

