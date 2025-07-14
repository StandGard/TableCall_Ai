# TableTalk AI Backend

A professional Node.js/Express backend for the TableTalk AI restaurant phone management system. This backend handles contact form submissions, email automation, lead management, and provides analytics for the B2B SaaS platform.

## 🚀 Features

- **Contact Form Processing**: Secure form submission with validation and duplicate prevention
- **Email Automation**: Auto-response emails for customers and notifications for sales team
- **Lead Management**: Track contact status, trial requests, and conversion analytics
- **Security**: Rate limiting, CSRF protection, input sanitization, and comprehensive security headers
- **GDPR Compliance**: Data retention policies, deletion requests, and consent tracking
- **Analytics**: Contact form performance metrics and lead conversion tracking
- **Health Monitoring**: Built-in health checks and error tracking with Sentry integration

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn package manager

## 🛠️ Installation

1. **Clone and setup**
```bash
git clone <repository-url>
cd tabletalk-ai-backend
npm install
```

2. **Environment configuration**
```bash
# Copy the environment template
cp env.template .env

# Edit .env with your actual values
nano .env
```

3. **Database setup**
```bash
# Create PostgreSQL database
createdb tabletalk_ai

# Run migrations
npm run migrate

# Optional: Add demo data
npm run migrate -- --demo
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔧 Environment Variables

### Required Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tabletalk_ai
DB_USER=tabletalk_user
DB_PASSWORD=your_secure_password

# Email (required for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tabletalk.ai
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@tabletalk.ai
SALES_EMAIL=sales@tabletalk.ai

# Application
APP_URL=https://tabletalk.ai
PORT=3000
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

### Optional Variables
```bash
# Production settings
APP_ENV=production
API_RATE_LIMIT=100
CSRF_SECRET=your_csrf_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn

# External Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
DEMO_PHONE_NUMBER=+447777000000

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
MIXPANEL_TOKEN=your_mixpanel_token
```

## 📚 API Documentation

### Contact Form Submission

**POST** `/api/contact`

Submit a new contact form with restaurant details.

```json
{
  "name": "John Smith",
  "email": "john@restaurant.com", 
  "restaurant": "The Italian Place",
  "phone": "+44 20 1234 5678",
  "trial": true,
  "consent_given": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your interest! We'll be in touch within 24 hours.",
  "id": 123
}
```

**Validation Rules:**
- `name`: 2-100 characters, required
- `email`: Valid email format, required
- `restaurant`: 2-200 characters, required
- `phone`: UK format (+44 or 07), required
- `trial`: Boolean, optional (default: false)
- `consent_given`: Boolean, optional (default: false)

**Rate Limiting:** 3 requests per 15 minutes per IP

### Demo Call Tracking

**POST** `/api/contact/demo-call`

Track demo call interactions for analytics.

```json
{
  "phone": "+44 7123 456789",
  "timestamp": "2025-07-14T10:30:00Z",
  "duration": 120,
  "outcome": "interested"
}
```

**Rate Limiting:** 10 requests per 5 minutes per IP

### Analytics (Protected)

**GET** `/api/contact/analytics?days=30`

Get contact form submission analytics.

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-07-14",
      "total_submissions": 15,
      "trial_requests": 8,
      "conversions": 3
    }
  ],
  "period": "30 days"
}
```

### Admin Endpoints (Protected)

- **GET** `/api/contact` - List all contacts with pagination
- **GET** `/api/contact/:id` - Get specific contact details
- **PUT** `/api/contact/:id/status` - Update contact status

### Health Checks

- **GET** `/health` - Basic health check
- **GET** `/api/health` - Detailed health check with database status

## 🔒 Security Features

### Rate Limiting
- Global: 100 requests per 15 minutes per IP
- Contact form: 3 submissions per 15 minutes per IP
- Demo calls: 10 requests per 5 minutes per IP

### Input Protection
- Joi validation schemas
- Input sanitization (XSS prevention)
- CSRF token protection (production)
- SQL injection prevention (parameterized queries)

### Headers & CORS
- Helmet.js security headers
- CORS protection with whitelist
- Content Security Policy
- HSTS headers in production

### Data Protection
- Password-less architecture
- IP address logging
- User agent tracking
- GDPR compliance features

## 📊 Database Schema

### contact_submissions
- `id` - Serial primary key
- `name` - Contact name
- `email` - Contact email
- `restaurant_name` - Restaurant name
- `phone` - Normalized phone number
- `wants_trial` - Trial request boolean
- `submitted_at` - Submission timestamp
- `status` - Lead status (new/contacted/converted/rejected)
- `notes` - Admin notes
- `lead_source` - Traffic source
- `consent_given` - GDPR consent
- `data_retention_date` - Auto-calculated retention date
- `deletion_requested` - GDPR deletion flag
- `ip_address` - Client IP
- `user_agent` - Client browser

### Indexes
- `idx_contact_submissions_email` - Email lookups
- `idx_contact_submissions_submitted_at` - Date sorting
- `idx_contact_submissions_status` - Status filtering

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- contact.test.js
```

## 🚀 Deployment

### Docker Deployment

1. **Create Dockerfile** (included in project)
```bash
docker build -t tabletalk-ai-backend .
docker run -p 3000:3000 --env-file .env tabletalk-ai-backend
```

2. **Docker Compose** (for local development)
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: tabletalk_ai
      POSTGRES_USER: tabletalk_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### VPS Deployment

1. **Server Setup**
```bash
# Ubuntu 22.04 LTS
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm postgresql nginx certbot

# Install PM2 for process management
npm install -g pm2
```

2. **Application Deployment**
```bash
# Clone repository
git clone <repo-url> /var/www/tabletalk-ai
cd /var/www/tabletalk-ai

# Install dependencies
npm ci --production

# Setup environment
cp env.template .env
nano .env

# Run migrations
npm run migrate

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

3. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name api.tabletalk.ai;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment-Specific Settings

**Development:**
- CSRF disabled
- Detailed error messages
- Auto-restart on file changes
- Debug logging enabled

**Production:**
- CSRF protection enabled
- Generic error messages
- Process monitoring with PM2
- Compressed responses
- Security headers enforced

## 🔍 Monitoring

### Health Checks
- **Basic**: `GET /health` - Server status
- **Detailed**: `GET /api/health` - Database + email status

### Error Tracking
- Sentry integration for error monitoring
- Structured logging with request IDs
- Performance metrics collection

### Analytics
- Contact form conversion rates
- Lead source attribution
- Trial request tracking
- Response time monitoring

## 🛠️ Maintenance

### Backup
```bash
# Daily database backup
pg_dump -h localhost -U tabletalk_user tabletalk_ai > backup_$(date +%Y%m%d).sql

# Automated backup script
0 2 * * * /home/deploy/scripts/backup_db.sh
```

### GDPR Compliance
```bash
# Clean up expired data (run monthly)
node scripts/gdpr-cleanup.js

# Export user data
node scripts/export-user-data.js --email=user@example.com
```

### Log Rotation
```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@tabletalk.ai
- Documentation: https://docs.tabletalk.ai
- Issues: https://github.com/tabletalk-ai/backend/issues

---

**TableTalk AI** - Never miss another reservation 📞✨ 