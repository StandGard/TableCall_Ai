const request = require('supertest');
const app = require('../server');
const { testConnection, query } = require('../config/database');
const ContactSubmission = require('../models/ContactSubmission');

// Mock email service to prevent actual emails during testing
jest.mock('../services/emailService', () => ({
  sendContactFormEmails: jest.fn().mockResolvedValue({
    autoResponse: { success: true, messageId: 'test-message-id' },
    internalNotification: { success: true, messageId: 'test-notification-id' }
  }),
  testConnection: jest.fn().mockResolvedValue(true)
}));

describe('Contact API Endpoints', () => {
  let server;

  beforeAll(async () => {
    // Test database connection
    try {
      await testConnection();
    } catch (error) {
      console.log('Database not available for testing, skipping tests');
      return;
    }
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      await query('DELETE FROM contact_submissions WHERE email LIKE %test%');
    } catch (error) {
      // Ignore if table doesn't exist
    }
  });

  describe('POST /api/contact', () => {
    const validContactData = {
      name: 'Test Restaurant Owner',
      email: 'test@testrestaurant.co.uk',
      restaurant: 'Test Restaurant',
      phone: '07123456789',
      trial: true,
      consent_given: true
    };

    test('should successfully submit valid contact form', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send(validContactData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining("We'll be in touch"),
        id: expect.any(Number)
      });
    });

    test('should return validation errors for missing required fields', async () => {
      const invalidData = {
        name: 'Test',
        // Missing email, restaurant, phone
      };

      const response = await request(app)
        .post('/api/contact')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('required')
          }),
          expect.objectContaining({
            field: 'restaurant',
            message: expect.stringContaining('required')
          }),
          expect.objectContaining({
            field: 'phone',
            message: expect.stringContaining('required')
          })
        ])
      });
    });

    test('should validate email format', async () => {
      const invalidEmailData = {
        ...validContactData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/contact')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('valid email')
        })
      );
    });

    test('should validate UK phone number format', async () => {
      const invalidPhoneData = {
        ...validContactData,
        phone: '123456789' // Invalid format
      };

      const response = await request(app)
        .post('/api/contact')
        .send(invalidPhoneData)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'phone',
          message: expect.stringContaining('valid UK phone number')
        })
      );
    });

    test('should accept various UK phone number formats', async () => {
      const phoneFormats = [
        '07123456789',
        '+44 7123 456789',
        '+447123456789',
        '(07123) 456789'
      ];

      for (const phone of phoneFormats) {
        const testData = {
          ...validContactData,
          email: `test+${Date.now()}@testrestaurant.co.uk`,
          phone
        };

        const response = await request(app)
          .post('/api/contact')
          .send(testData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      }
    });

    test('should prevent duplicate submissions within 1 hour', async () => {
      // First submission
      await request(app)
        .post('/api/contact')
        .send(validContactData)
        .expect(201);

      // Second submission with same email
      const response = await request(app)
        .post('/api/contact')
        .send(validContactData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('already received recently'),
        error: 'DUPLICATE_SUBMISSION'
      });
    });

    test('should sanitize input data', async () => {
      const maliciousData = {
        ...validContactData,
        name: '<script>alert("xss")</script>Test Name',
        restaurant: 'Restaurant<script>alert("xss")</script>',
        email: 'test+xss@testrestaurant.co.uk'
      };

      const response = await request(app)
        .post('/api/contact')
        .send(maliciousData)
        .expect(201);

      // Verify the data was saved without script tags
      const savedContact = await ContactSubmission.findById(response.body.id);
      expect(savedContact.name).not.toContain('<script>');
      expect(savedContact.restaurant_name).not.toContain('<script>');
    });

    test('should enforce rate limiting', async () => {
      // Make 3 requests (the limit)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/contact')
          .send({
            ...validContactData,
            email: `test${i}@testrestaurant.co.uk`
          })
          .expect(201);
      }

      // 4th request should be rate limited
      const response = await request(app)
        .post('/api/contact')
        .send({
          ...validContactData,
          email: 'test4@testrestaurant.co.uk'
        })
        .expect(429);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Too many'),
        error: 'RATE_LIMIT_EXCEEDED'
      });
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(ContactSubmission.prototype, 'save').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/contact')
        .send(validContactData)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('error occurred'),
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });

  describe('POST /api/contact/demo-call', () => {
    const validDemoCallData = {
      phone: '07123456789',
      timestamp: new Date().toISOString(),
      duration: 120,
      outcome: 'interested'
    };

    test('should successfully track demo call', async () => {
      const response = await request(app)
        .post('/api/contact/demo-call')
        .send(validDemoCallData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Demo call data recorded successfully',
        data: expect.objectContaining({
          phone: expect.stringContaining('+44'),
          duration: 120,
          outcome: 'interested'
        })
      });
    });

    test('should validate demo call data', async () => {
      const invalidData = {
        phone: 'invalid-phone',
        duration: -5, // Invalid negative duration
        outcome: 'invalid-outcome'
      };

      const response = await request(app)
        .post('/api/contact/demo-call')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'phone'
          }),
          expect.objectContaining({
            field: 'duration'
          }),
          expect.objectContaining({
            field: 'outcome'
          })
        ])
      });
    });

    test('should enforce demo call rate limiting', async () => {
      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/contact/demo-call')
          .send(validDemoCallData);
      }

      // 11th request should be rate limited
      const response = await request(app)
        .post('/api/contact/demo-call')
        .send(validDemoCallData)
        .expect(429);

      expect(response.body.error).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('GET /api/contact/analytics', () => {
    test('should return analytics data', async () => {
      const response = await request(app)
        .get('/api/contact/analytics')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        period: expect.stringContaining('days')
      });
    });

    test('should accept custom days parameter', async () => {
      const response = await request(app)
        .get('/api/contact/analytics?days=7')
        .expect(200);

      expect(response.body.period).toBe('7 days');
    });
  });

  describe('GET /api/contact/:id', () => {
    let contactId;

    beforeEach(async () => {
      // Create a test contact
      const contact = new ContactSubmission({
        name: 'Test Contact',
        email: 'test-get@testrestaurant.co.uk',
        restaurant: 'Test Restaurant',
        phone: '07123456789',
        trial: false,
        consent_given: true
      });
      const saved = await contact.save();
      contactId = saved.id;
    });

    test('should return contact by ID', async () => {
      const response = await request(app)
        .get(`/api/contact/${contactId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: contactId,
          name: 'Test Contact',
          email: 'test-get@testrestaurant.co.uk'
        })
      });
    });

    test('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .get('/api/contact/99999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Contact submission not found',
        error: 'NOT_FOUND'
      });
    });

    test('should validate contact ID format', async () => {
      const response = await request(app)
        .get('/api/contact/invalid-id')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid contact ID',
        error: 'INVALID_ID'
      });
    });
  });

  describe('PUT /api/contact/:id/status', () => {
    let contactId;

    beforeEach(async () => {
      const contact = new ContactSubmission({
        name: 'Test Status Update',
        email: 'test-status@testrestaurant.co.uk',
        restaurant: 'Test Restaurant',
        phone: '07123456789',
        trial: false,
        consent_given: true
      });
      const saved = await contact.save();
      contactId = saved.id;
    });

    test('should update contact status', async () => {
      const updateData = {
        status: 'contacted',
        notes: 'Called customer, interested in trial'
      };

      const response = await request(app)
        .put(`/api/contact/${contactId}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Contact status updated successfully',
        data: expect.objectContaining({
          id: contactId,
          status: 'contacted',
          notes: 'Called customer, interested in trial'
        })
      });
    });

    test('should validate status values', async () => {
      const invalidData = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/api/contact/${contactId}/status`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid status value',
        error: 'INVALID_STATUS'
      });
    });
  });

  describe('GET /api/contact', () => {
    test('should return paginated contacts', async () => {
      const response = await request(app)
        .get('/api/contact')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        pagination: expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
          totalCount: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPrevPage: expect.any(Boolean)
        })
      });
    });

    test('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/contact?page=2&limit=10')
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });
  });
});

describe('Health Check Endpoints', () => {
  test('GET /health should return basic health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'healthy',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
      environment: expect.any(String)
    });
  });

  test('GET /api/health should return detailed health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'healthy',
      timestamp: expect.any(String),
      services: expect.objectContaining({
        database: expect.any(String),
        email: expect.any(String)
      }),
      uptime: expect.any(Number),
      environment: expect.any(String)
    });
  });
});

describe('Error Handling', () => {
  test('should handle 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown-endpoint')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Endpoint not found',
      error: 'NOT_FOUND',
      requestedPath: '/api/unknown-endpoint'
    });
  });

  test('should handle CORS errors', async () => {
    const response = await request(app)
      .get('/api/contact')
      .set('Origin', 'https://malicious-site.com')
      .expect(403);

    // Note: This test might behave differently depending on CORS configuration
    // In real scenarios, CORS errors are handled by the browser
  });
}); 