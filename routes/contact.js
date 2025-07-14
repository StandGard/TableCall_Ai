const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ContactSubmission = require('../models/ContactSubmission');
const { validateContact, validateDemoCall, normalizePhone } = require('../validation/contactValidation');
const emailService = require('../services/emailService');

// Rate limiting for contact form submissions
const contactFormLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message: 'Too many contact form submissions, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for demo call tracking
const demoCallLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many demo call requests, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});

// Helper function to get client IP
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Helper function to get user agent
const getUserAgent = (req) => {
  return req.get('User-Agent') || '';
};

/**
 * POST /api/contact
 * Submit contact form
 */
router.post('/', contactFormLimit, async (req, res) => {
  try {
    console.log('Contact form submission received:', req.body);

    // Validate input data
    const validation = validateContact(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check for duplicate submissions (same email within last hour)
    const recentSubmissions = await ContactSubmission.findByEmail(validation.data.email);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentSubmission = recentSubmissions.find(submission => 
      new Date(submission.submitted_at) > oneHourAgo
    );
    
    if (recentSubmission) {
      return res.status(409).json({
        success: false,
        message: 'A submission with this email was already received recently. Please wait before submitting again.',
        error: 'DUPLICATE_SUBMISSION'
      });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(validation.data.phone);

    // Create contact submission object
    const contactData = {
      ...validation.data,
      phone: normalizedPhone,
      ip_address: getClientIP(req),
      user_agent: getUserAgent(req)
    };

    // Save to database
    const contact = new ContactSubmission(contactData);
    const savedContact = await contact.save();

    console.log('Contact submission saved:', savedContact.id);

    // Send emails asynchronously
    emailService.sendContactFormEmails(savedContact, savedContact.id)
      .then(emailResults => {
        console.log('Email results:', emailResults);
      })
      .catch(emailError => {
        console.error('Email sending failed:', emailError);
      });

    // Return success response
    res.status(201).json({
      success: true,
      message: "Thank you for your interest! We'll be in touch within 24 hours.",
      id: savedContact.id
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    
    // Return generic error to avoid exposing internal details
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again.',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * POST /api/demo-call
 * Track demo call data
 */
router.post('/demo-call', demoCallLimit, async (req, res) => {
  try {
    console.log('Demo call tracking received:', req.body);

    // Validate input data
    const validation = validateDemoCall(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(validation.data.phone);

    // Find related contact submission if exists
    let contactSubmissionId = null;
    const contactSubmissions = await ContactSubmission.findByEmail(''); // We only have phone, not email
    // TODO: Implement phone-based lookup if needed

    // Create demo call record
    const demoCallData = {
      contact_submission_id: contactSubmissionId,
      phone: normalizedPhone,
      call_timestamp: validation.data.timestamp || new Date(),
      duration: validation.data.duration,
      outcome: validation.data.outcome,
      notes: validation.data.notes || null
    };

    // Save demo call (would need DemoCall model)
    // For now, just log the data
    console.log('Demo call data to be saved:', demoCallData);

    res.status(201).json({
      success: true,
      message: 'Demo call data recorded successfully',
      data: demoCallData
    });

  } catch (error) {
    console.error('Demo call tracking error:', error);
    
    res.status(500).json({
      success: false,
      message: 'An error occurred while tracking the demo call.',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /api/contact/analytics
 * Get contact form analytics (protected endpoint)
 */
router.get('/analytics', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const days = parseInt(req.query.days) || 30;
    const analytics = await ContactSubmission.getAnalytics(days);
    
    res.json({
      success: true,
      data: analytics,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /api/contact/:id
 * Get specific contact submission (protected endpoint)
 */
router.get('/:id', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID',
        error: 'INVALID_ID'
      });
    }

    const contact = await ContactSubmission.findById(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found',
        error: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact data',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * PUT /api/contact/:id/status
 * Update contact submission status (protected endpoint)
 */
router.put('/:id/status', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const id = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID',
        error: 'INVALID_ID'
      });
    }

    const validStatuses = ['new', 'contacted', 'converted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        error: 'INVALID_STATUS'
      });
    }

    const updatedContact = await ContactSubmission.updateStatus(id, status, notes);
    
    if (!updatedContact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found',
        error: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Contact status updated successfully',
      data: updatedContact
    });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /api/contact
 * Get all contact submissions with pagination (protected endpoint)
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await ContactSubmission.findAll(page, limit);
    
    res.json({
      success: true,
      data: result.submissions,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

module.exports = router; 