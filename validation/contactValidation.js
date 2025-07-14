const Joi = require('joi');
const validator = require('validator');

// UK phone number regex pattern
const ukPhoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;

// Contact form validation schema
const contactSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
    
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
    
  restaurant: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.base': 'Restaurant name must be a string',
      'string.empty': 'Restaurant name is required',
      'string.min': 'Restaurant name must be at least 2 characters long',
      'string.max': 'Restaurant name cannot exceed 200 characters',
      'any.required': 'Restaurant name is required'
    }),
    
  phone: Joi.string()
    .pattern(ukPhoneRegex)
    .required()
    .messages({
      'string.base': 'Phone number must be a string',
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please enter a valid UK phone number (e.g., 07123 456789 or +44 7123 456789)',
      'any.required': 'Phone number is required'
    }),
    
  trial: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Trial field must be a boolean value'
    }),
    
  consent_given: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Consent field must be a boolean value'
    })
});

// Demo call validation schema
const demoCallSchema = Joi.object({
  phone: Joi.string()
    .pattern(ukPhoneRegex)
    .required()
    .messages({
      'string.base': 'Phone number must be a string',
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please enter a valid UK phone number',
      'any.required': 'Phone number is required'
    }),
    
  timestamp: Joi.date()
    .iso()
    .default(() => new Date())
    .messages({
      'date.base': 'Timestamp must be a valid date',
      'date.format': 'Timestamp must be in ISO format'
    }),
    
  duration: Joi.number()
    .integer()
    .min(0)
    .max(3600) // max 1 hour
    .messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be an integer',
      'number.min': 'Duration cannot be negative',
      'number.max': 'Duration cannot exceed 3600 seconds (1 hour)'
    }),
    
  outcome: Joi.string()
    .valid('interested', 'not_interested', 'callback_requested')
    .messages({
      'string.base': 'Outcome must be a string',
      'any.only': 'Outcome must be one of: interested, not_interested, callback_requested'
    })
});

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(validator.trim(input));
  }
  return input;
};

// Validate and sanitize contact form data
const validateContact = (data) => {
  // First sanitize all string inputs
  const sanitizedData = {};
  for (const [key, value] of Object.entries(data)) {
    sanitizedData[key] = sanitizeInput(value);
  }
  
  // Then validate with Joi
  const { error, value } = contactSchema.validate(sanitizedData, {
    abortEarly: false, // Return all validation errors
    stripUnknown: true // Remove unknown fields
  });
  
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: validationErrors,
      data: null
    };
  }
  
  return {
    isValid: true,
    errors: [],
    data: value
  };
};

// Validate demo call data
const validateDemoCall = (data) => {
  const sanitizedData = {};
  for (const [key, value] of Object.entries(data)) {
    sanitizedData[key] = sanitizeInput(value);
  }
  
  const { error, value } = demoCallSchema.validate(sanitizedData, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: validationErrors,
      data: null
    };
  }
  
  return {
    isValid: true,
    errors: [],
    data: value
  };
};

// Additional validation helpers
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

const isValidPhone = (phone) => {
  return ukPhoneRegex.test(phone);
};

const normalizePhone = (phone) => {
  // Remove all spaces and special characters
  let normalized = phone.replace(/[\s\(\)\-]/g, '');
  
  // Convert to international format if needed
  if (normalized.startsWith('07')) {
    normalized = '+44' + normalized.substring(1);
  }
  
  return normalized;
};

module.exports = {
  contactSchema,
  demoCallSchema,
  validateContact,
  validateDemoCall,
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  normalizePhone
}; 