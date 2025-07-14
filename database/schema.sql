-- TableTalk AI Database Schema

-- Contact submissions table
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  restaurant_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  wants_trial BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'converted', 'rejected'
  notes TEXT,
  lead_source VARCHAR(100) DEFAULT 'website_contact_form',
  consent_given BOOLEAN DEFAULT FALSE,
  data_retention_date TIMESTAMP,
  deletion_requested BOOLEAN DEFAULT FALSE,
  ip_address INET,
  user_agent TEXT
);

-- Demo call tracking table (optional)
CREATE TABLE demo_calls (
  id SERIAL PRIMARY KEY,
  contact_submission_id INTEGER REFERENCES contact_submissions(id),
  phone VARCHAR(20) NOT NULL,
  call_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INTEGER, -- seconds
  outcome VARCHAR(50), -- 'interested', 'not_interested', 'callback_requested'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_submitted_at ON contact_submissions(submitted_at);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_restaurant_name ON contact_submissions(restaurant_name);
CREATE INDEX idx_demo_calls_phone ON demo_calls(phone);
CREATE INDEX idx_demo_calls_timestamp ON demo_calls(call_timestamp);

-- Create function to update data retention date
CREATE OR REPLACE FUNCTION update_data_retention_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set data retention date to 2 years from submission (GDPR compliance)
  NEW.data_retention_date = NEW.submitted_at + INTERVAL '2 years';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set data retention date
CREATE TRIGGER set_data_retention_date
  BEFORE INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_data_retention_date(); 