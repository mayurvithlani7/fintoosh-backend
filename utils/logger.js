const winston = require('winston');
const Sentry = require('@sentry/node');

// Initialize Sentry (only in production)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mobile-kid-budgeting-simulator-backend' },
  transports: [
    // Console transport for all environments with colored output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
  ],
});

// Add Sentry transport for production error and warn levels
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  logger.add(
    new winston.transports.Console({
      level: 'warn',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );

  // Override console methods to also send to Sentry
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = function (...args) {
    Sentry.captureException(new Error(args.join(' ')));
    originalConsoleError.apply(console, args);
  };

  console.warn = function (...args) {
    Sentry.captureMessage(args.join(' '), 'warning');
    originalConsoleWarn.apply(console, args);
  };
}

module.exports = logger;
