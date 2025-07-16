require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const compression = require('compression');
const morgan = require('morgan');
const Sentry = require('@sentry/node');

// Import our modules
const { testConnection } = require('./config/database');
const emailService = require('./services/emailService');
const security = require('./middleware/security');
const contactRoutes = require('./routes/contact');

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.APP_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Basic middleware
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Request logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none'
  }
}));

// Security middleware
app.use(security.requestLogger);
app.use(security.securityHeaders);
app.use(security.helmetMiddleware);
app.use(security.corsMiddleware);
app.use(security.globalRateLimit);
app.use(security.sanitizeInput);

// Health check endpoint (before CSRF to avoid token issues)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.APP_ENV || 'development'
  });
});

// API health check with database status
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    const emailStatus = await emailService.testConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        email: emailStatus ? 'connected' : 'disconnected'
      },
      uptime: process.uptime(),
      environment: process.env.APP_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        email: 'unknown'
      },
      error: error.message
    });
  }
});

// CSRF protection (after health checks)
if (process.env.APP_ENV === 'production') {
  app.use(security.csrfProtection);
  
  // CSRF token endpoint
  app.get('/api/csrf-token', (req, res) => {
    res.json({
      success: true,
      csrfToken: req.csrfToken()
    });
  });
}

// API Routes
app.use('/api/contact', contactRoutes);

// Serve static files for frontend (if needed)
if (process.env.SERVE_STATIC) {
  app.use(express.static('public'));
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TableTalk AI Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      contact: '/api/contact',
      health: '/health',
      apiHealth: '/api/health'
    },
    documentation: process.env.API_DOCS_URL || 'https://tabletalk.ai/docs'
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: 'NOT_FOUND',
    requestedPath: req.originalUrl
  });
});

// Error handling middleware (must be last)
app.use(security.errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close database connections
    require('./config/database').pool.end(() => {
      console.log('Database connections closed.');
      process.exit(0);
    });
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Forceful shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 TableTalk AI Backend started on port ${PORT}`);
  console.log(`📧 Environment: ${process.env.APP_ENV || 'development'}`);
  
  try {
    // Test database connection
    await testConnection();
    console.log('✅ Database connection verified');
    
    // Test email service
    const emailStatus = await emailService.testConnection();
    console.log(`📧 Email service: ${emailStatus ? '✅ Connected' : '❌ Disconnected'}`);
    
  } catch (error) {
    console.error('❌ Startup checks failed:', error);
    
    // Don't exit in development, but log the error
    if (process.env.APP_ENV === 'production') {
      process.exit(1);
    }
  }
  
  console.log('\n📚 Available endpoints:');
  console.log(`   GET  /                    - API information`);
  console.log(`   GET  /health              - Health check`);
  console.log(`   GET  /api/health          - Detailed health check`);
  console.log(`   POST /api/contact         - Submit contact form`);
  console.log(`   POST /api/contact/demo-call - Track demo calls`);
  console.log(`   GET  /api/contact         - List contacts (protected)`);
  console.log(`   GET  /api/contact/:id     - Get contact (protected)`);
  console.log(`   PUT  /api/contact/:id/status - Update status (protected)`);
  console.log(`   GET  /api/contact/analytics - Get analytics (protected)`);
  
  if (process.env.APP_ENV === 'production') {
    console.log(`   GET  /api/csrf-token      - Get CSRF token`);
  }
  
  console.log('\n🎯 Ready to receive requests!');
});

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }
  
  // In production, exit the process
  if (process.env.APP_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  
  process.exit(1);
});

module.exports = app; 