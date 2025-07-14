const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
    
    this.fromEmail = process.env.FROM_EMAIL;
    this.salesEmail = process.env.SALES_EMAIL;
    this.appUrl = process.env.APP_URL;
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send messages');
      return true;
    } catch (error) {
      console.error('Email service configuration error:', error);
      return false;
    }
  }

  // Generate auto-response email template
  generateAutoResponseTemplate(contactData) {
    const { name, restaurant_name, trial } = contactData;
    const trialText = trial ? 
      "Since you requested a trial, we'll get you set up immediately after our call." : 
      "We'll discuss the best setup options for your restaurant during our call.";

    return {
      subject: "Welcome to TableTalk AI - Your Setup Details",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .cta-button { 
              display: inline-block; 
              background-color: #3498db; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 10px 5px;
            }
            .demo-number { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2c3e50; 
              background-color: #ecf0f1; 
              padding: 10px; 
              border-radius: 5px; 
              text-align: center; 
              margin: 15px 0;
            }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to TableTalk AI!</h1>
            </div>
            
            <div class="content">
              <h2>Hi ${name},</h2>
              
              <p>Thank you for your interest in TableTalk AI! We're excited to help <strong>${restaurant_name}</strong> never miss another reservation.</p>
              
              <h3>What happens next:</h3>
              <ul>
                <li>Our team will review your requirements</li>
                <li>We'll call you within 24 hours to discuss your needs</li>
                <li>${trialText}</li>
              </ul>
              
              <h3>In the meantime, feel free to:</h3>
              <div style="text-align: center;">
                <div class="demo-number">
                  Try our demo line: ${process.env.DEMO_PHONE_NUMBER || '+44 7777 000000'}
                </div>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${this.appUrl}/setup-guide" class="cta-button">View Setup Guide</a>
                <a href="${this.appUrl}/book-call" class="cta-button">Book a Specific Time</a>
              </div>
              
              <p>Questions? Just reply to this email and we'll get back to you immediately.</p>
              
              <p>Best regards,<br>
              <strong>The TableTalk AI Team</strong></p>
            </div>
            
            <div class="footer">
              <p>TableTalk AI - Intelligent Restaurant Phone Management</p>
              <p><a href="${this.appUrl}">Visit our website</a> | <a href="${this.appUrl}/unsubscribe">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name},

Thank you for your interest in TableTalk AI! We're excited to help ${restaurant_name} never miss another reservation.

What happens next:
1. Our team will review your requirements
2. We'll call you within 24 hours to discuss your needs
3. ${trialText}

In the meantime, feel free to:
- Try our demo line: ${process.env.DEMO_PHONE_NUMBER || '+44 7777 000000'}
- Check out our setup guide: ${this.appUrl}/setup-guide
- Book a specific time: ${this.appUrl}/book-call

Questions? Just reply to this email.

Best regards,
The TableTalk AI Team

TableTalk AI - Intelligent Restaurant Phone Management
Visit our website: ${this.appUrl}
      `
    };
  }

  // Generate internal notification email template
  generateInternalNotificationTemplate(contactData, submissionId) {
    const { name, email, restaurant_name, phone, trial, submitted_at } = contactData;
    const trialStatus = trial ? "YES" : "NO";
    const adminLink = `${this.appUrl}/admin/leads/${submissionId}`;

    return {
      subject: `New Lead: ${restaurant_name} - Trial: ${trialStatus}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .detail-row { 
              display: flex; 
              border-bottom: 1px solid #eee; 
              padding: 10px 0; 
            }
            .detail-label { 
              font-weight: bold; 
              width: 150px; 
              color: #2c3e50;
            }
            .detail-value { 
              flex: 1; 
            }
            .trial-yes { 
              color: #27ae60; 
              font-weight: bold; 
              font-size: 18px;
            }
            .trial-no { 
              color: #7f8c8d; 
            }
            .actions { 
              background-color: #f8f9fa; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .cta-button { 
              display: inline-block; 
              background-color: #3498db; 
              color: white; 
              padding: 10px 20px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 NEW LEAD SUBMITTED</h1>
            </div>
            
            <div class="content">
              <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${name}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Email:</div>
                <div class="detail-value"><a href="mailto:${email}">${email}</a></div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Restaurant:</div>
                <div class="detail-value"><strong>${restaurant_name}</strong></div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Phone:</div>
                <div class="detail-value"><a href="tel:${phone}">${phone}</a></div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Trial Requested:</div>
                <div class="detail-value ${trial ? 'trial-yes' : 'trial-no'}">${trialStatus}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Submitted:</div>
                <div class="detail-value">${submitted_at}</div>
              </div>
              
              <div class="actions">
                <h3>⚡ Action Required:</h3>
                <ul>
                  <li><strong>Contact within 24 hours</strong></li>
                  ${trial ? '<li><strong>Set up demo environment</strong></li>' : ''}
                  <li>Add to CRM</li>
                  <li>Follow up sequence</li>
                </ul>
                
                <div style="text-align: center; margin-top: 20px;">
                  <a href="tel:${phone}" class="cta-button">📞 Call Now</a>
                  <a href="mailto:${email}" class="cta-button">📧 Send Email</a>
                  <a href="${adminLink}" class="cta-button">👀 View Details</a>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
NEW LEAD SUBMITTED

Name: ${name}
Email: ${email}
Restaurant: ${restaurant_name}
Phone: ${phone}
Trial Requested: ${trialStatus}
Submitted: ${submitted_at}

Action Required:
- Contact within 24 hours
${trial ? '- Set up demo environment' : ''}
- Add to CRM
- Follow up sequence

Lead Details: ${adminLink}
      `
    };
  }

  // Send auto-response email to customer
  async sendAutoResponse(contactData) {
    try {
      const template = this.generateAutoResponseTemplate(contactData);
      
      const mailOptions = {
        from: this.fromEmail,
        to: contactData.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Auto-response email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending auto-response email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send internal notification email to sales team
  async sendInternalNotification(contactData, submissionId) {
    try {
      const template = this.generateInternalNotificationTemplate(contactData, submissionId);
      
      const mailOptions = {
        from: this.fromEmail,
        to: this.salesEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Internal notification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending internal notification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send both emails (auto-response and internal notification)
  async sendContactFormEmails(contactData, submissionId) {
    const results = await Promise.allSettled([
      this.sendAutoResponse(contactData),
      this.sendInternalNotification(contactData, submissionId)
    ]);

    return {
      autoResponse: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason },
      internalNotification: results[1].status === 'fulfilled' ? results[1].value : { success: false, error: results[1].reason }
    };
  }
}

module.exports = new EmailService(); 