# Bluemantle Security Documentation

Comprehensive guide to Bluemantle's security architecture, features, and best practices.

---

## 🔐 Security Overview

Bluemantle implements a multi-layered security approach:

1. **Authentication** - Verify user identity
2. **Authorization** - Control what users can access
3. **Content Protection** - Prevent unauthorized content access
4. **Data Protection** - Secure data in transit and at rest
5. **Monitoring** - Detect and respond to threats

---

## 🔑 Authentication System

### JWT + HTTP-Only Cookies

Bluemantle uses a hybrid approach for maximum security:

```
┌─────────────────────────────────────────┐
│ User Login Attempt                      │
│ Email: student@bluemantle.com           │
│ Password: xxxxxxxxxx                    │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────────┐
       │ Validate Creds    │
       │ & Device Hash     │
       └───────┬───────────┘
               │
       ┌───────▼───────────────┐
       │ Known Device?         │
       ├───────────┬───────────┤
       │  YES      │    NO     │
       │           │           │
       ▼           ▼           ▼
   Issue JWT   Generate OTP  Issue JWT
   in Cookie   & Send Email  in Cookie
       │                         │
       └────────────┬────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ HTTP-Only Cookie Set │
         │ (Secure, SameSite)   │
         └──────────────────────┘
```

### Benefits of HTTP-Only Cookies

- ✅ **XSS Protection**: JavaScript cannot access the cookie
- ✅ **Automatic Transmission**: Cookie sent with every request
- ✅ **CSRF Protection**: SameSite attribute prevents cross-site requests
- ✅ **Easier Logout**: Simply delete the cookie on backend

### Device Fingerprinting

Before issuing a token, the system creates a device hash:

```javascript
const deviceHash = crypto
  .createHash('sha256')
  .update(
    userAgent +           // Browser/OS info
    screenResolution +    // Display resolution
    timezone +            // User's timezone
    language              // Browser language
  )
  .digest('hex');
```

**Process:**
1. On first login, hash is calculated
2. Hash is stored in database as "known device"
3. Subsequent logins check hash against known devices
4. New device? → Require OTP verification
5. OTP verified? → Add device to whitelist

---

## 📱 OTP (One-Time Password) Verification

When login attempt detected from new device:

```
┌──────────────────────────────┐
│ New Device Detected          │
│ Hash: abc123xyz...           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Generate 6-Digit OTP         │
│ Valid for: 10 minutes        │
│ Code: 123456                 │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Send via Email               │
│ to: student@bluemantle.com   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ User Enters Code             │
│ Verify against DB            │
│ Check timestamp              │
└──────────────┬───────────────┘
               │
       ┌───────▼───────┐
       │               │
    VALID           INVALID
       │               │
       ▼               ▼
    ✅ Allow       ❌ Deny
    Issue JWT    (try again)
    Add Device
```

**Constraints:**
- OTP valid only once
- Expires after 10 minutes
- Maximum 5 attempts per 15 minutes
- Failed attempts logged for audit

---

## 🛡️ Content Protection (Student Routes)

Bluemantle prevents common content theft methods on student dashboards:

### Disabled Features on `/student/*` Routes

```javascript
// 1. Right-Click Prevention
document.addEventListener('contextmenu', e => e.preventDefault());

// 2. Developer Tools Detection
const detectDevTools = () => {
  if (window.outerWidth - window.innerWidth > 160) {
    // DevTools detected - logout user
    logoutUser();
  }
};
setInterval(detectDevTools, 2000);

// 3. Keyboard Shortcuts Disabled
document.addEventListener('keydown', e => {
  if (
    e.key === 'F12' ||                    // F12
    (e.ctrlKey && e.key === 'i') ||       // Ctrl+Shift+I
    (e.ctrlKey && e.key === 'u') ||       // Ctrl+U (view source)
    (e.ctrlKey && e.key === 'c')          // Ctrl+C (copy)
  ) {
    e.preventDefault();
    showSecurityWarning();
  }
});

// 4. Copy/Paste Prevention
document.addEventListener('copy', e => {
  e.preventDefault();
  showSecurityWarning();
});
document.addEventListener('paste', e => {
  e.preventDefault();
});
```

### Enabled on Other Routes

- `/` (login) - Full access for accessibility
- `/teacher/*` - Tools enabled (need to develop)
- `/admin/*` - Full developer access

---

## 🔐 Password Security

### Password Requirements

```
✅ Minimum 8 characters
✅ Must contain uppercase letter
✅ Must contain lowercase letter  
✅ Must contain number
✅ Must contain special character (!@#$%^&*)
```

### Password Hashing

```javascript
// Backend implementation
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Verification
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Never:**
- ❌ Store plain text passwords
- ❌ Use MD5 or SHA1
- ❌ Use salt rounds < 10
- ❌ Log passwords in any form

---

## 🌐 Network Security

### HTTPS/TLS

**All communication MUST use HTTPS:**
```
Production: https://bluemantle.com
Backend: https://api.bluemantle.com
```

### CORS (Cross-Origin Resource Sharing)

```javascript
// Backend configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,    // Only allow frontend domain
  credentials: true,                    // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

**Whitelist Rules:**
- Production frontend URL only
- Never use wildcard (*) in production
- Each environment has its own whitelist
- Review before deployment

### Headers Security

```javascript
// Content Security Policy
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self';"
  );
  
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  
  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  next();
});
```

---

## 🔒 Data Protection

### Sensitive Data Fields

**Never expose:**
- Password hashes (obviously)
- JWT secrets
- Device hashes
- OTP codes
- Zoom SDK secrets
- API keys

**Always hash before storage:**
- Passwords
- Device fingerprints

### Encryption for Sensitive Data

```javascript
// For storing sensitive URLs/tokens
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

function encrypt(text, secretKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText, secretKey) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Data in Transit

All API requests use HTTPS with:
- TLS 1.2 or higher
- Strong ciphers
- Certificate pinning (optional)

---

## ✅ Input Validation

### Never Trust User Input

```javascript
// ✅ Always validate
const { email, password } = req.body;

// 1. Check presence
if (!email || !password) {
  return res.status(400).json({ error: 'Email and password required' });
}

// 2. Validate format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}

// 3. Sanitize/clean
const cleanEmail = email.trim().toLowerCase();

// 4. Check length
if (password.length < 8 || password.length > 128) {
  return res.status(400).json({ error: 'Invalid password length' });
}
```

### SQL/NoSQL Injection Prevention

```javascript
// ❌ Vulnerable to injection
const users = await User.find({ email: userInput });

// ✅ Safe - using parameterized queries
const users = await User.findOne({ email: sanitizeInput(userInput) });

// ✅ Use input validation library
const { body, validationResult } = require('express-validator');

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).trim()
], loginController);
```

---

## 🔄 Session Management

### Session Timeout

```javascript
// Sessions expire after 24 hours
const JWT_EXPIRY = '24h';

// Or implement sliding windows:
// - Extend expiry on each request
// - Total session max of 72 hours
const extendSession = (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // Check if close to expiry (< 1 hour left)
  const secondsLeft = decoded.exp - (Date.now() / 1000);
  
  if (secondsLeft < 3600) {
    // Issue new token
    return issueNewToken(decoded.userId);
  }
  
  return token;
};
```

### Concurrent Login Prevention

```javascript
// Only one active session per user
const loginUser = async (userId) => {
  // 1. Find all active sessions for user
  const activeSessions = await Session.find({
    userId,
    expiresAt: { $gt: Date.now() }
  });
  
  // 2. Invalidate old sessions
  await Session.updateMany(
    { userId, _id: { $ne: newSessionId } },
    { isActive: false }
  );
  
  // 3. Create new session
  const newSession = await Session.create({
    userId,
    deviceHash,
    token: generatedJWT,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  
  return newSession.token;
};
```

---

## 🚨 Logging & Monitoring

### Security Events to Log

Always log:
```javascript
// Authentication events
- Successful login (user, IP, device)
- Failed login attempt (email, reason)
- OTP verification (success/failure)
- Logout (user, timestamp)

// Authorization events
- Content access by unauthorized user
- Admin action (what, who, when)
- Role change for user

// System events
- DevTools detection
- Suspicious activity
- Error conditions
```

### Implementation

```javascript
const logSecurityEvent = (eventType, details) => {
  const logEntry = {
    timestamp: new Date(),
    eventType,
    userId: details.userId,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    details: details
  };
  
  // Store in database
  SecurityLog.create(logEntry);
  
  // Alert if critical
  if (eventType === 'UNAUTHORIZED_ACCESS_ATTEMPT') {
    sendSecurityAlert(logEntry);
  }
};
```

---

## 🛠️ Security Best Practices

### Development

1. **Use Environment Variables**
   ```bash
   ❌ const secret = 'my-secret-key';
   ✅ const secret = process.env.JWT_SECRET;
   ```

2. **Never Commit Secrets**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   ```

3. **Validate in Development**
   ```javascript
   if (NODE_ENV === 'production') {
     if (!JWT_SECRET || JWT_SECRET.length < 64) {
       throw new Error('JWT_SECRET too short or missing');
     }
   }
   ```

4. **Use HTTPS for Local Development**
   ```bash
   # Use self-signed certificate
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
   ```

### Deployment

1. **Rotate Secrets Regularly**
   - JWT_SECRET every 90 days
   - API keys annually
   - Database passwords semi-annually

2. **Security Headers**
   - HTTPS only
   - HSTS enabled
   - CSP configured

3. **Access Control**
   - Principle of least privilege
   - Role-based access
   - API rate limiting

4. **Monitoring**
   - Alert on failed logins
   - Monitor unauthorized access attempts
   - Track admin actions

---

## 🔍 Security Audit Checklist

**Before Each Deployment:**

- [ ] No hardcoded credentials
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Authentication required for protected routes
- [ ] Authorization verified server-side
- [ ] Passwords hashed with bcrypt
- [ ] Session timeout configured
- [ ] Security headers set
- [ ] Logging enabled
- [ ] Error messages don't leak info
- [ ] Dependencies updated
- [ ] No debug code in production
- [ ] Secrets rotated since last deployment

---

## 🆘 Security Incident Response

### If Credentials Are Compromised

1. **Immediate Actions**
   - Rotate the compromised credential
   - Invalidate all active sessions
   - Alert all users
   - Review logs for unauthorized access

2. **Investigation**
   - Check access logs
   - Identify affected users
   - Determine scope of breach
   - Document timeline

3. **Recovery**
   - Update authentication mechanisms
   - Monitor for further attempts
   - Follow up with affected users
   - Update security measures

### Reporting Security Issues

Do NOT create public issues for security vulnerabilities.

1. Email: `security@bluemantle.com`
2. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

---

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 📝 Security Policy Updates

This document is reviewed:
- **Quarterly**: Check for new vulnerabilities
- **On each release**: Verify security measures
- **When incidents occur**: Update as needed

**Last Updated**: May 2026  
**Next Review**: August 2026

---

## ❓ Questions?

For security questions or concerns:
- Review this document
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Contact the security team

Remember: **Security is everyone's responsibility!** 🔐

