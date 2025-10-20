const validator = require('validator');
const xss = require('xss');

const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string inputs
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(validator.escape(obj[key]));
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

const validateUserInput = (req, res, next) => {
  const { name, email } = req.body;

  if (name && !validator.isLength(name, { min: 2, max: 50 })) {
    return res.status(400).json({ message: 'Name must be 2-50 characters' });
  }

  if (email && !validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  next();
};

const validateFinancialData = (req, res, next) => {
  const { amount, cost, points, currentPoints, savePoints, spendPoints, donatePoints, investPoints } = req.body;

  // Validate amounts and costs (should be positive numbers)
  const financialFields = { amount, cost, points, currentPoints, savePoints, spendPoints, donatePoints, investPoints };

  for (const [field, value] of Object.entries(financialFields)) {
    if (value !== undefined && (typeof value !== 'number' || value < 0 || !isFinite(value))) {
      return res.status(400).json({ message: `${field} must be a non-negative number` });
    }
  }

  // Validate percentage splits for money jars
  const { defaultSplit, customSplit } = req.body;
  const validateSplit = (split, fieldName) => {
    if (!split || typeof split !== 'object') return;

    const jars = ['current', 'save', 'spend', 'donate', 'invest'];
    let total = 0;

    for (const jar of jars) {
      const percentage = split[jar];
      if (percentage !== undefined) {
        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
          return res.status(400).json({ message: `${fieldName} ${jar} must be a number between 0 and 100` });
        }
        total += percentage;
      }
    }

    if (Math.abs(total - 100) > 0.01) { // Allow small floating point errors
      return res.status(400).json({ message: `${fieldName} percentages must total exactly 100%` });
    }
  };

  if (defaultSplit) validateSplit(defaultSplit, 'Default split');
  if (customSplit) validateSplit(customSplit, 'Custom split');

  next();
};

const validatePIN = (req, res, next) => {
  const { pin, newPin } = req.body;

  if (pin && !/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ message: 'PIN must be 4-6 digits' });
  }

  if (newPin && !/^\d{4,6}$/.test(newPin)) {
    return res.status(400).json({ message: 'New PIN must be 4-6 digits' });
  }

  next();
};

const validateMobileNumber = (req, res, next) => {
  const { mobileNumber, parentMobile, identifier } = req.body;

  const numbersToValidate = [mobileNumber, parentMobile, identifier].filter(Boolean);

  for (const number of numbersToValidate) {
    // Allow both +91 prefixed and non-prefixed Indian mobile numbers
    const mobileRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!mobileRegex.test(number.replace(/\s+/g, ''))) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }
  }

  next();
};

const validatePassword = (req, res, next) => {
  const { password, newPassword, currentPassword } = req.body;

  const passwordsToValidate = [password, newPassword, currentPassword].filter(Boolean);

  for (const pwd of passwordsToValidate) {
    if (typeof pwd !== 'string' || pwd.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
  }

  next();
};

const validateMessage = (req, res, next) => {
  const { text, note } = req.body;

  const messagesToValidate = [text, note].filter(Boolean);

  for (const message of messagesToValidate) {
    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    if (message.length > 500) {
      return res.status(400).json({ message: 'Message cannot exceed 500 characters' });
    }
  }

  next();
};

module.exports = {
  sanitizeInput,
  validateUserInput,
  validateFinancialData,
  validatePIN,
  validateMobileNumber,
  validatePassword,
  validateMessage
};
