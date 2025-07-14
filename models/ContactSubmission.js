const { query } = require('../config/database');

class ContactSubmission {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.restaurant_name = data.restaurant;
    this.phone = data.phone;
    this.wants_trial = data.trial || false;
    this.status = data.status || 'new';
    this.notes = data.notes || null;
    this.lead_source = data.lead_source || 'website_contact_form';
    this.consent_given = data.consent_given || false;
    this.ip_address = data.ip_address || null;
    this.user_agent = data.user_agent || null;
  }

  // Create a new contact submission
  async save() {
    const text = `
      INSERT INTO contact_submissions 
      (name, email, restaurant_name, phone, wants_trial, status, notes, lead_source, consent_given, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      this.name,
      this.email,
      this.restaurant_name,
      this.phone,
      this.wants_trial,
      this.status,
      this.notes,
      this.lead_source,
      this.consent_given,
      this.ip_address,
      this.user_agent
    ];

    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving contact submission:', error);
      throw error;
    }
  }

  // Find submission by email
  static async findByEmail(email) {
    const text = 'SELECT * FROM contact_submissions WHERE email = $1 ORDER BY submitted_at DESC';
    try {
      const result = await query(text, [email]);
      return result.rows;
    } catch (error) {
      console.error('Error finding contact submission by email:', error);
      throw error;
    }
  }

  // Find submission by ID
  static async findById(id) {
    const text = 'SELECT * FROM contact_submissions WHERE id = $1';
    try {
      const result = await query(text, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding contact submission by ID:', error);
      throw error;
    }
  }

  // Get all submissions with pagination
  static async findAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const text = `
      SELECT * FROM contact_submissions 
      ORDER BY submitted_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    try {
      const result = await query(text, [limit, offset]);
      
      // Get total count
      const countResult = await query('SELECT COUNT(*) FROM contact_submissions');
      const totalCount = parseInt(countResult.rows[0].count);
      
      return {
        submissions: result.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting all contact submissions:', error);
      throw error;
    }
  }

  // Update submission status
  static async updateStatus(id, status, notes = null) {
    const text = `
      UPDATE contact_submissions 
      SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    try {
      const result = await query(text, [status, notes, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating contact submission status:', error);
      throw error;
    }
  }

  // Mark for deletion (GDPR compliance)
  static async markForDeletion(id) {
    const text = `
      UPDATE contact_submissions 
      SET deletion_requested = true
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await query(text, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error marking contact submission for deletion:', error);
      throw error;
    }
  }

  // Get submissions that need to be deleted (GDPR compliance)
  static async getExpiredSubmissions() {
    const text = `
      SELECT * FROM contact_submissions 
      WHERE data_retention_date < CURRENT_TIMESTAMP 
      OR deletion_requested = true
    `;
    
    try {
      const result = await query(text);
      return result.rows;
    } catch (error) {
      console.error('Error getting expired contact submissions:', error);
      throw error;
    }
  }

  // Delete submission permanently (GDPR compliance)
  static async deleteById(id) {
    const text = 'DELETE FROM contact_submissions WHERE id = $1 RETURNING *';
    
    try {
      const result = await query(text, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting contact submission:', error);
      throw error;
    }
  }

  // Get analytics data
  static async getAnalytics(days = 30) {
    const text = `
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE wants_trial = true) as trial_requests,
        COUNT(*) FILTER (WHERE status = 'converted') as conversions
      FROM contact_submissions 
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `;
    
    try {
      const result = await query(text);
      return result.rows;
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw error;
    }
  }
}

module.exports = ContactSubmission; 