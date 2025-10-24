const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

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

    // Allow localhost for development (any port)
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) return callback(null, true);

    // Allow your production frontend domains
    const allowedOrigins = [
      'https://fintoosh-frontend.onrender.com',
      'http://localhost:8081',
      'http://localhost:3000',
      'exp://',
      'https://expo.dev'
    ];

    if (allowedOrigins.some(allowed => origin && origin.includes(allowed))) {
      return callback(null, true);
    }

    // Allow all origins for now (remove this in production for security)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
});

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

mongoose.connection.once('open', async () => {
  console.log('MongoDB connection opened');

  // Seed education modules if collection is empty
  try {
    const EducationModule = require('./models/EducationModule');
    const count = await EducationModule.countDocuments();
    if (count === 0) {
      console.log('Education modules collection is empty, seeding...');
      const { seedEducationModules } = require('./scripts/seed-education-modules');
      await seedEducationModules();
      console.log('Education modules seeded successfully');
    } else {
      console.log(`Education modules collection has ${count} documents`);
    }
  } catch (error) {
    console.error('Error checking/seeding education modules:', error);
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

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Mobile Kid Budgeting Simulator API' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
