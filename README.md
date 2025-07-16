# 🍽️ TableTalk AI - Complete Project

**TableTalk AI** is a B2B SaaS platform that provides AI-powered phone answering for restaurants. This repository contains both the frontend website and the backend API that powers the entire system.

## 🏗️ Project Structure Overview

This is a **monorepo** containing both frontend and backend code:

```
TableCall_Ai/                          # Root repository
├── 🌐 FRONTEND FILES                   # → Deployed to Netlify
│   ├── public/index.html               # Main production frontend
│   └── tabletalk-homepage-connected.html # Alternative frontend version
│
├── ⚙️ BACKEND FILES                    # → Deployed to Railway  
│   ├── server.js                       # Main Express server
│   ├── config/database.js              # Database configuration
│   ├── routes/contact.js               # API endpoints
│   ├── middleware/security.js          # CORS, security, rate limiting
│   ├── services/emailService.js        # Email automation
│   ├── models/ContactSubmission.js     # Data models
│   ├── validation/contactValidation.js # Input validation
│   ├── database/schema.sql             # Database schema
│   ├── scripts/migrate.js              # Database migration tool
│   └── tests/contact.test.js           # API tests
│
├── 🚀 DEPLOYMENT CONFIG
│   ├── render.yaml                     # Railway/Render deployment config
│   ├── Dockerfile                      # Docker configuration
│   ├── docker-compose.yml              # Local Docker setup
│   └── package.json                    # Node.js dependencies
│
└── 📚 DOCUMENTATION
    ├── README.md                       # This file
    ├── DEPLOYMENT.md                   # Deployment guide
    ├── QUICKSTART.md                   # Quick setup guide
    └── env.template                    # Environment variables template
```

## 🌐 Live Deployments

- **Frontend**: https://tablecallai.netlify.app (Netlify)
- **Backend API**: https://tabletalk-ai-backend-production.up.railway.app (Railway)
- **GitHub Repo**: https://github.com/StandGard/TableCall_Ai

## 🎯 How It All Works Together

1. **Frontend** (Netlify) serves the restaurant landing page with contact form
2. **Backend** (Railway) processes form submissions, sends emails, stores data
3. **Database** (Railway PostgreSQL) stores contact submissions and analytics
4. **Email Service** sends automated responses and sales notifications

## 🌐 Frontend Development

### Files & Structure
```
Frontend Files:
├── public/index.html                   # 🎯 MAIN PRODUCTION FRONTEND
└── tabletalk-homepage-connected.html   # Alternative version
```

### Making Frontend Changes

1. **Edit the HTML file**:
   ```bash
   # For production changes, edit:
   nano public/index.html
   
   # For testing/alternative version:
   nano tabletalk-homepage-connected.html
   ```

2. **Test locally**:
   ```bash
   # Open in browser or use a local server
   python3 -m http.server 8000
   # Visit: http://localhost:8000/public/
   ```

3. **Deploy to Netlify**:
   ```bash
   git add public/index.html
   git commit -m "Update frontend: description of changes"
   git push
   # Netlify auto-deploys from GitHub in ~2-3 minutes
   ```

### Frontend API Configuration
The frontend is configured to call your Railway backend:
```javascript
const API_BASE_URL = 'https://tabletalk-ai-backend-production.up.railway.app';
```

## ⚙️ Backend Development

### Files & Structure
```
Backend Files:
├── server.js                          # Main Express application
├── config/
│   └── database.js                    # PostgreSQL connection
├── routes/
│   └── contact.js                     # API endpoints (/api/contact)
├── middleware/
│   └── security.js                    # CORS, rate limiting, security
├── services/
│   └── emailService.js                # Email automation (nodemailer)
├── models/
│   └── ContactSubmission.js           # Database models
├── validation/
│   └── contactValidation.js           # Input validation (Joi)
├── database/
│   └── schema.sql                     # Database schema
├── scripts/
│   └── migrate.js                     # Database migration tool
└── tests/
    └── contact.test.js                # API tests (Jest)
```

### Making Backend Changes

1. **Local development setup**:
   ```bash
   # Install dependencies
   npm install
   
   # Copy environment template
   cp env.template .env
   
   # Edit environment variables
   nano .env
   
   # Run database migration
   npm run migrate -- --demo
   
   # Start development server
   npm run dev
   ```

2. **Make your changes**:
   ```bash
   # Edit API routes
   nano routes/contact.js
   
   # Edit database models  
   nano models/ContactSubmission.js
   
   # Update security/CORS settings
   nano middleware/security.js
   ```

3. **Test your changes**:
   ```bash
   # Run tests
   npm test
   
   # Test API endpoints
   curl http://localhost:3000/health
   curl -X POST http://localhost:3000/api/contact -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","restaurant":"Test Restaurant","phone":"07123456789","consent_given":true}'
   ```

4. **Deploy to Railway**:
   ```bash
   git add .
   git commit -m "Update backend: description of changes"
   git push
   # Railway auto-deploys from GitHub in ~3-5 minutes
   ```

## 📊 Database Management

### Schema & Tables
- **contact_submissions**: Stores form submissions
- **demo_calls**: Tracks demo call requests
- Includes indexes, triggers, and data retention policies

### Database Operations
```bash
# Run migration (creates tables)
npm run migrate

# Add demo data
npm run migrate -- --demo

# Connect to production database (if needed)
psql $DATABASE_URL
```

## 🚀 Deployment Process

### Automatic Deployments
Both frontend and backend deploy automatically when you push to GitHub:

1. **Make changes** to any files
2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Describe your changes"
   git push
   ```
3. **Deployments happen automatically**:
   - **Frontend**: Netlify deploys in ~2-3 minutes
   - **Backend**: Railway deploys in ~3-5 minutes

### Deployment Status
- **Frontend**: Check https://app.netlify.com deployments
- **Backend**: Check Railway dashboard for deployment logs
- **Health Check**: https://tabletalk-ai-backend-production.up.railway.app/health

## 🔧 Common Development Tasks

### Adding a New API Endpoint
```bash
# 1. Add route in routes/contact.js
# 2. Add validation in validation/contactValidation.js  
# 3. Update tests in tests/contact.test.js
# 4. Commit and push to deploy
```

### Updating Frontend Styling
```bash
# 1. Edit public/index.html (CSS is inline)
# 2. Test locally by opening file in browser
# 3. Commit and push to deploy to Netlify
```

### Adding Environment Variables
```bash
# 1. Add to env.template (for documentation)
# 2. Add to Railway dashboard under Environment Variables
# 3. Update config/database.js or server.js to use new variables
```

## 🚨 Troubleshooting Common Issues

### CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**: Add your domain to `middleware/security.js`:
```javascript
const allowedOrigins = [
  'https://tablecallai.netlify.app',
  'https://yourdomain.com', // Add new domains here
  // ...
];
```

### Database Connection Errors
**Problem**: Backend can't connect to database
**Solution**: Check `DATABASE_URL` in Railway environment variables

### Frontend Not Updating
**Problem**: Netlify deployment failed
**Solutions**:
- Check Netlify deployment logs
- Ensure `public/index.html` exists
- Clear browser cache

### Backend API Errors
**Problem**: API returning 500 errors
**Solutions**:
- Check Railway deployment logs
- Test health endpoint: `/health`
- Verify environment variables are set

## 🛠️ Development Workflow

### For Frontend Changes:
1. Edit `public/index.html`
2. Test locally (open in browser)
3. Commit & push → auto-deploys to Netlify

### For Backend Changes:
1. Edit relevant files (routes, models, etc.)
2. Test locally with `npm run dev`
3. Run tests with `npm test`
4. Commit & push → auto-deploys to Railway

### For Database Changes:
1. Update `database/schema.sql`
2. Update migration script if needed
3. Test locally with `npm run migrate`
4. Deploy backend changes

## 📞 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `POST /api/contact` - Submit contact form

### Protected Endpoints (require authentication)
- `GET /api/contact` - List all contacts
- `GET /api/contact/analytics` - Get submission analytics
- `PUT /api/contact/:id/status` - Update contact status

## 🔒 Security Features

- **CORS Protection**: Only allows requests from approved domains
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user input
- **CSRF Protection**: Prevents cross-site request forgery (production only)
- **Security Headers**: Helmet.js for security headers
- **Data Sanitization**: Removes potential XSS attacks

## 📈 Monitoring & Analytics

- **Health Checks**: `/health` and `/api/health` endpoints
- **Error Tracking**: Sentry integration (if configured)
- **Request Logging**: Morgan for HTTP request logs
- **Database Analytics**: Built-in contact form analytics

## 🏃‍♂️ Quick Start Commands

```bash
# Clone repository
git clone https://github.com/StandGard/TableCall_Ai.git
cd TableCall_Ai

# Backend setup
npm install
cp env.template .env
# Edit .env with your database credentials
npm run migrate -- --demo
npm run dev

# Frontend testing
# Open public/index.html in browser
# Or use: python3 -m http.server 8000

# Deploy changes
git add .
git commit -m "Your changes"
git push
```

---

## 🎓 What You Should Read Next

**As a beginner, follow this order:**

1. **Start Here**: Read this README.md (you're doing it! ✅)
2. **Quick Setup**: Read `QUICKSTART.md` for step-by-step local setup
3. **Deployment**: Read `DEPLOYMENT.md` for deployment details
4. **Make Changes**: Use the "Development Workflow" section above
5. **Troubleshooting**: Refer to "Common Issues" section when problems arise

**Your development workflow is simple:**
1. Make changes to files
2. Test locally (if needed)  
3. `git add . && git commit -m "description" && git push`
4. Wait 2-5 minutes for auto-deployment ✨ 