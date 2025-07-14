# TableTalk AI Backend - Quick Start Guide

Get the TableTalk AI backend running in under 5 minutes! 🚀

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running locally (or use Docker)
- Git

## Option 1: Quick Local Setup (5 minutes)

### 1. Clone and Install
```bash
git clone <repository-url>
cd tabletalk-ai-backend
npm install
```

### 2. Database Setup
```bash
# Create database
createdb tabletalk_ai

# Or use Docker for database only
docker run --name tabletalk-postgres -e POSTGRES_DB=tabletalk_ai -e POSTGRES_USER=tabletalk_user -e POSTGRES_PASSWORD=secure_password -p 5432:5432 -d postgres:15
```

### 3. Environment Configuration
```bash
# Copy template and edit
cp env.template .env

# Minimum required configuration for local development:
echo "DB_HOST=localhost
DB_PORT=5432
DB_NAME=tabletalk_ai
DB_USER=tabletalk_user
DB_PASSWORD=secure_password
FROM_EMAIL=noreply@tabletalk.ai
SALES_EMAIL=sales@tabletalk.ai
APP_URL=http://localhost:3000
PORT=3000
JWT_SECRET=dev_jwt_secret_123
SESSION_SECRET=dev_session_secret_123" > .env
```

### 4. Database Migration
```bash
# Run migrations with demo data
npm run migrate -- --demo
```

### 5. Start Development Server
```bash
npm run dev
```

**✅ Done!** API is running at http://localhost:3000

## Option 2: Docker Compose (3 minutes)

### 1. Clone Repository
```bash
git clone <repository-url>
cd tabletalk-ai-backend
```

### 2. Start Everything
```bash
# Start all services (database + API)
docker-compose up -d

# Check logs
docker-compose logs -f api
```

### 3. Run Migrations
```bash
# Access the container and run migrations
docker-compose exec api npm run migrate -- --demo
```

**✅ Done!** API is running at http://localhost:3000

## Quick Testing

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Submit Test Contact Form
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@testrestaurant.co.uk", 
    "restaurant": "Test Restaurant",
    "phone": "07123456789",
    "trial": true,
    "consent_given": true
  }'
```

### 3. Check Analytics
```bash
curl http://localhost:3000/api/contact/analytics
```

## Available Endpoints

Once running, visit:
- **API Info**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Detailed Health**: http://localhost:3000/api/health
- **Submit Contact**: POST http://localhost:3000/api/contact
- **Analytics**: http://localhost:3000/api/contact/analytics

## Email Testing

For development, you can use:
- **Mailtrap** (free): https://mailtrap.io
- **Ethereal Email** (free): https://ethereal.email
- **Gmail** with app password

Update your `.env` file:
```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_password
```

## Frontend Integration

### HTML Form Example
```html
<form id="contact-form">
  <input type="text" name="name" placeholder="Your Name" required>
  <input type="email" name="email" placeholder="Email" required>
  <input type="text" name="restaurant" placeholder="Restaurant Name" required>
  <input type="tel" name="phone" placeholder="Phone Number" required>
  <label>
    <input type="checkbox" name="trial"> Request Free Trial
  </label>
  <label>
    <input type="checkbox" name="consent_given" required> I agree to be contacted
  </label>
  <button type="submit">Get Started</button>
</form>

<script>
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    restaurant: formData.get('restaurant'),
    phone: formData.get('phone'),
    trial: formData.has('trial'),
    consent_given: formData.has('consent_given')
  };
  
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Thank you! We\'ll be in touch within 24 hours.');
      e.target.reset();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
});
</script>
```

### React Component Example
```jsx
import { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    restaurant: '',
    phone: '',
    trial: false,
    consent_given: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Thank you! We\'ll be in touch within 24 hours.');
        setFormData({
          name: '',
          email: '',
          restaurant: '',
          phone: '',
          trial: false,
          consent_given: false
        });
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="Restaurant Name"
        value={formData.restaurant}
        onChange={(e) => setFormData({...formData, restaurant: e.target.value})}
        required
      />
      <input
        type="tel"
        placeholder="Phone Number"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        required
      />
      <label>
        <input
          type="checkbox"
          checked={formData.trial}
          onChange={(e) => setFormData({...formData, trial: e.target.checked})}
        />
        Request Free Trial
      </label>
      <label>
        <input
          type="checkbox"
          checked={formData.consent_given}
          onChange={(e) => setFormData({...formData, consent_given: e.target.checked})}
          required
        />
        I agree to be contacted
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Get Started'}
      </button>
    </form>
  );
}
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql -h localhost -U tabletalk_user -d tabletalk_ai

# Reset database
dropdb tabletalk_ai && createdb tabletalk_ai
npm run migrate
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

### Email Not Working
1. Check SMTP credentials in `.env`
2. Verify firewall/antivirus isn't blocking port 587
3. Use Mailtrap for development testing
4. Check server logs for detailed error messages

### Docker Issues
```bash
# Stop all containers
docker-compose down

# Remove volumes and start fresh
docker-compose down -v
docker-compose up --build

# Check container logs
docker-compose logs api
docker-compose logs postgres
```

## Production Deployment

For production deployment, see the full [README.md](./README.md) for:
- VPS setup instructions
- Nginx configuration
- SSL certificate setup
- PM2 process management
- Backup strategies
- Monitoring setup

## Need Help?

- 📧 Email: support@tabletalk.ai
- 📖 Full docs: [README.md](./README.md)
- 🐛 Issues: Create a GitHub issue
- 💬 Questions: Check existing issues first

---

**Happy coding! 🎉** Your TableTalk AI backend is ready to handle restaurant leads! 