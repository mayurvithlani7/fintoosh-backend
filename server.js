const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Rate limiting middleware

// General rate limiting: 100 requests per IP per 5 minutes for all general public routes
const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
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

    // Allow localhost for development
    if (origin && origin.includes('localhost')) return callback(null, true);

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
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));

// Apply sensitive rate limiting to specific sensitive routes
app.use('/api/auth/request-parent-otp', sensitiveLimiter);
app.use('/api/auth/request-reactivation-otp', sensitiveLimiter);

app.use('/api', require('./routes/data'));

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
