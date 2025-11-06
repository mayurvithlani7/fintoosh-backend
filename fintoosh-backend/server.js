const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
require('dotenv').config();

// 🔒 CRITICAL SECURITY: Validate JWT secret at startup
if (!process.env.JWT_SECRET) {
  console.error('❌ CRITICAL SECURITY ERROR: JWT_SECRET environment variable not configured!');
  console.error('🔒 SECURITY REQUIREMENT: JWT_SECRET must be set for secure authentication.');
  console.error('💡 SOLUTION: Set JWT_SECRET in your environment variables (.env file)');
  console.error('⚠️  APPLICATION CANNOT START WITHOUT PROPER JWT CONFIGURATION');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting middleware

// Role-based rate limiting for authenticated users
const createRoleBasedLimiter = (role) => {
  const limits = {
    parent: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    child: { windowMs: 15 * 60 * 1000, max: 50 },   // 50 requests per 15 minutes
    default: { windowMs: 15 * 60 * 1000, max: 30 }  // 30 requests per 15 minutes for anonymous
  };

  const limit = limits[role] || limits.default;

  return rateLimit({
    windowMs: limit.windowMs,
    max: limit.max,
    keyGenerator: (req) => `${req.user?.role || 'anonymous'}_${req.ip}`,
    handler: (req, res) => {
      const role = req.user?.role || 'anonymous';
      const resetTime = new Date(Date.now() + limit.windowMs);
      logger.warn('Rate limit exceeded', {
        role,
        ip: req.ip,
        userId: req.user?.id,
        endpoint: req.originalUrl,
        method: req.method,
        resetTime: resetTime.toISOString()
      });
      res.status(429).json({
        message: 'Too many requests, please slow down',
        retryAfter: Math.ceil(limit.windowMs / 1000),
        role: role,
        limit: limit.max,
        windowMs: limit.windowMs
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General IP-based rate limiting for unauthenticated routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting: 10 requests per IP per hour for sensitive routes
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per windowMs for sensitive routes
  message: 'Too many requests to sensitive endpoints, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Throttling for expensive operations (lower rate limits)
const expensiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Only 20 expensive operations per 15 minutes
  keyGenerator: (req) => `${req.user?.role || 'anonymous'}_${req.ip}`,
  message: 'Too many expensive operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Legacy auth limiter (kept for backward compatibility)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth routes
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.set('trust proxy', 1); // Trust first proxy for rate limiting

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow specific origins for development and production
    const allowedOrigins = [
      'https://fintoosh-frontend.onrender.com',
      'http://localhost:8081',
      'http://localhost:3000',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:3000',
      'exp://',
      'https://expo.dev'
    ];

    // Check if the origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // For development, allow any localhost origin
    if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }

    // Block other origins
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kid-budgeting-simulator';

// Determine if this is a local development environment
const isLocalConnection = mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1');

// Log connection details (without sensitive credentials)
const connectionType = isLocalConnection ? 'local' : 'Atlas';
const maskedURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
logger.info('MongoDB connection configuration', {
  type: connectionType,
  uri: maskedURI,
  ssl: !isLocalConnection,
  serverSelectionTimeout: 30000,
  socketTimeout: 45000
});

// Force loading of ledger models to create collections
//require('../models/LedgerAccount');
//require('../models/LedgerEntry');
//require('../models/LedgerTransaction');

// MongoDB connection - Use secure defaults for production, permissive options only for local dev
const connectionOptions = isLocalConnection ? {
  serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  ssl: true,
  checkServerIdentity: null, // Disable server identity checking for compatibility
  tlsAllowInvalidCertificates: true, // Allow invalid certificates for compatibility
  tlsAllowInvalidHostnames: false,
  minPoolSize: 2,
  maxPoolSize: 10,
} : {
  serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  minPoolSize: 2,
  maxPoolSize: 10,
  // Minimal SSL configuration - let MongoDB driver handle SSL automatically
};

logger.info('Attempting MongoDB connection...');
mongoose.connect(mongoURI, connectionOptions);

// Connection event handlers
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected successfully', {
    connectionType,
    database: mongoose.connection.name,
    host: mongoose.connection.host
  });
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', {
    error: err.message,
    code: err.code,
    codeName: err.codeName,
    connectionType,
    stack: err.stack
  });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected', {
    connectionType,
    reason: 'Connection lost'
  });
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected', {
    connectionType,
    database: mongoose.connection.name,
    host: mongoose.connection.host
  });
});

mongoose.connection.once('open', async () => {
  logger.info('MongoDB connection opened and ready', {
    connectionType,
    database: mongoose.connection.name,
    host: mongoose.connection.host,
    readyState: mongoose.connection.readyState
  });

  // Seed education modules if collection is empty
  try {
    const EducationModule = require('./models/EducationModule');
    const count = await EducationModule.countDocuments();
    if (count === 0) {
      logger.info('Education modules collection is empty, seeding...');
      const { seedEducationModules } = require('./scripts/seed-education-modules');
      await seedEducationModules();
      logger.info('Education modules seeded successfully');
    } else {
      logger.info('Education modules collection status', {
        documentCount: count,
        collection: 'education_modules'
      });
    }
  } catch (error) {
    logger.error('Error checking/seeding education modules', {
      error: error.message,
      stack: error.stack
    });
  }
});

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));

// Apply sensitive rate limiting to specific sensitive routes
app.use('/api/auth/request-parent-otp', sensitiveLimiter);
app.use('/api/auth/request-reactivation-otp', sensitiveLimiter);

app.use('/api', require('./routes/data'));
app.use('/api/education', require('./routes/education'));
app.use('/api/interest', require('./routes/interest'));
app.use('/api/ai', require('./routes/ai'));

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Mobile Kid Budgeting Simulator API' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ledger initialization endpoint (temporary - remove after use)
app.post('/api/admin/initialize-ledger', async (req, res) => {
  try {
    console.log('🔄 Starting ledger account initialization via API...');

    // Import models
    const LedgerAccount = require('../models/LedgerAccount');
    const User = require('../models/User');

    // Get all unique family IDs
    const families = await User.distinct('familyId');
    console.log(`📊 Found ${families.length} families`);

    let totalAccountsCreated = 0;

    // Process each family
    for (const familyId of families) {
      console.log(`🏠 Processing family: ${familyId}`);

      // Check if this family already has ledger accounts
      const existingAccounts = await LedgerAccount.countDocuments({ familyId });
      if (existingAccounts > 0) {
        console.log(`⏭️ Family ${familyId} already has ${existingAccounts} ledger accounts, skipping...`);
        continue;
      }

      // Get a user from this family to use as the account owner
      const familyUser = await User.findOne({ familyId }).select('id name');
      if (!familyUser) {
        console.log(`⚠️ No users found for family ${familyId}, skipping...`);
        continue;
      }

      console.log(`👤 Creating accounts for family member: ${familyUser.name} (${familyUser.id})`);

      // Create default chart of accounts for this family
      const accountsCreated = await LedgerAccount.createDefaultChartOfAccounts(familyId, familyUser.id);
      totalAccountsCreated += accountsCreated.length;

      console.log(`✅ Created ${accountsCreated.length} ledger accounts for family ${familyId}`);
    }

    console.log(`🎉 Ledger account initialization complete!`);
    console.log(`📈 Total accounts created: ${totalAccountsCreated}`);
    console.log(`👨‍👩‍👧‍👦 Families processed: ${families.length}`);

    res.json({
      success: true,
      message: 'Ledger accounts initialized successfully',
      stats: {
        familiesProcessed: families.length,
        accountsCreated: totalAccountsCreated
      }
    });

  } catch (error) {
    console.error('❌ Error initializing ledger accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize ledger accounts',
      error: error.message
    });
  }
});

// Final error handler middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send generic 500 Internal Server Error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

// Start server - try binding to specific IP
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Mobile server is running on ${HOST}:${PORT}`);
  console.log(`Test locally: http://localhost:${PORT}/api/health`);
  console.log(`For mobile testing: http://192.168.1.2:${PORT}/api/health`);
  console.log(`Server bound to: ${HOST}`);
});

module.exports = app;
