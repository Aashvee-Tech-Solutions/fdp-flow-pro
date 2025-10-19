# FDP Management System - Deployment Guide

## 📋 Overview

This is a complete Faculty Development Program (FDP) management system with:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Drizzle ORM
- **Database**: PostgreSQL
- **Integrations**: Email (Nodemailer), WhatsApp (Cloud API/Twilio), Payments (Cashfree)

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SMTP_*`: Email configuration
- `WHATSAPP_*` or `TWILIO_*`: WhatsApp configuration
- `CASHFREE_*`: Payment gateway credentials

### 3. Setup Database
```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:push
```

### 4. Run Development Servers

**Option A: Run both frontend and backend together**
```bash
npm run dev:full
```

**Option B: Run separately**
```bash
# Terminal 1 - Frontend (port 5000)
npm run dev

# Terminal 2 - Backend (port 3000)
npm run dev:backend
```

Frontend: http://localhost:5000
Backend API: http://localhost:3000/api

## 📦 Export & Deployment

This project is designed to be **fully portable** and can be deployed on any platform.

### Deployment Options

#### 1. Vercel (Frontend) + Railway/Render (Backend)

**Frontend (Vercel)**:
1. Push code to GitHub
2. Import repository in Vercel
3. Build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Add environment variables (VITE_* variables only)
5. Deploy

**Backend (Railway/Render)**:
1. Create new service from GitHub repository
2. Set environment variables
3. Build Command: `npm install`
4. Start Command: `npm run start:backend`
5. Add PostgreSQL database service
6. Deploy

#### 2. DigitalOcean App Platform

1. Create new app from GitHub
2. Add two components:
   - **Web Service** (Frontend):
     - Build: `npm run build`
     - Run: `npm run preview`
   - **Web Service** (Backend):
     - Build: `npm install`
     - Run: `npm run start:backend`
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy

#### 3. AWS (EC2 + RDS)

1. Launch EC2 instance (Ubuntu 22.04)
2. Create RDS PostgreSQL instance
3. SSH into EC2 and clone repository
4. Install Node.js 20:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
5. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
6. Setup PM2 for process management:
   ```bash
   sudo npm install -g pm2
   pm2 start server/index.ts --name fdp-backend
   pm2 start npm --name fdp-frontend -- start
   pm2 save
   pm2 startup
   ```
7. Configure Nginx as reverse proxy

#### 4. Heroku

**For Backend**:
1. Create new Heroku app
2. Add PostgreSQL addon
3. Set environment variables in Settings
4. Create `Procfile`:
   ```
   web: npm run start:backend
   ```
5. Deploy via Git:
   ```bash
   heroku git:remote -a your-app-name
   git push heroku main
   ```

**For Frontend**: Deploy to Vercel or Netlify

#### 5. Self-Hosted (VPS)

**Using Docker Compose** (create `docker-compose.yml`):
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backend:3000

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/fdp
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=fdp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔧 Environment Variables Reference

### Database
- `DATABASE_URL`: PostgreSQL connection string

### Email (Nodemailer)
- `SMTP_HOST`: SMTP server (e.g., smtp.gmail.com)
- `SMTP_PORT`: SMTP port (587 for TLS, 465 for SSL)
- `SMTP_SECURE`: true/false
- `SMTP_USER`: Email username
- `SMTP_PASS`: Email password/app password
- `SMTP_FROM`: From email address

### WhatsApp (Choose one)

**Option A: WhatsApp Cloud API (Meta)**
- `WHATSAPP_API_URL`: https://graph.facebook.com/v18.0
- `WHATSAPP_PHONE_ID`: Your WhatsApp Business phone ID
- `WHATSAPP_TOKEN`: WhatsApp Business API token

**Option B: Twilio**
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_WHATSAPP_NUMBER`: Twilio WhatsApp number

### Payment (Cashfree)
- `CASHFREE_APP_ID`: Cashfree app ID
- `CASHFREE_SECRET_KEY`: Cashfree secret key
- `CASHFREE_API_URL`: API URL (sandbox/production)

### Application
- `PORT`: Backend server port (default: 3000)
- `NODE_ENV`: production/development
- `API_URL`: Full backend API URL
- `APP_URL`: Full frontend URL

## 📊 Database Schema

The system includes:
- **fdp_events**: FDP event details
- **host_colleges**: Host college registrations
- **faculty_registrations**: Faculty registrations
- **payments**: Payment records
- **communication_logs**: Email/WhatsApp logs
- **certificates**: Generated certificates
- **certificate_templates**: Certificate templates
- **coupons**: Discount coupons
- **admin_users**: Admin user accounts

## 🔌 API Endpoints

### FDP Events
- `GET /api/fdp-events` - List all FDP events
- `GET /api/fdp-events/:id` - Get specific FDP
- `POST /api/fdp-events` - Create FDP (Admin)
- `PUT /api/fdp-events/:id` - Update FDP (Admin)
- `DELETE /api/fdp-events/:id` - Delete FDP (Admin)

### Registrations
- `POST /api/host-colleges` - Register host college
- `POST /api/faculty-registrations` - Register faculty
- `GET /api/fdp-events/:fdpId/host-colleges` - Get host colleges
- `GET /api/fdp-events/:fdpId/faculty` - Get faculty list
- `GET /api/host-colleges/:id/faculty` - Get faculty by host college

### Payments
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Cashfree webhook

### Communications
- `POST /api/communications/bulk-email` - Send bulk emails
- `POST /api/communications/bulk-whatsapp` - Send bulk WhatsApp

### Analytics
- `GET /api/fdp-events/:fdpId/analytics` - Get FDP analytics

### Coupons
- `POST /api/coupons/validate` - Validate coupon code

## 🛡️ Security Considerations

1. **Environment Variables**: Never commit `.env` to git
2. **HTTPS**: Always use HTTPS in production
3. **Database**: Use connection pooling and SSL
4. **API Keys**: Rotate keys regularly
5. **CORS**: Configure proper CORS origins
6. **Rate Limiting**: Add rate limiting middleware
7. **Input Validation**: All inputs are validated via Zod schemas

## 📱 WhatsApp Setup

### Option 1: WhatsApp Cloud API (Free, Recommended)
1. Create Meta Business account
2. Set up WhatsApp Business API
3. Get Phone Number ID and Access Token
4. Add to environment variables

### Option 2: Twilio (Paid, Easier Setup)
1. Create Twilio account
2. Enable WhatsApp sandbox or get approved number
3. Add credentials to environment variables

## 💳 Payment Gateway Setup

### Cashfree
1. Sign up at cashfree.com
2. Get API credentials from dashboard
3. Use sandbox for testing
4. Switch to production URL when ready
5. Configure webhook URL: `https://your-api.com/api/payments/webhook`

## 📧 Email Setup

### Gmail SMTP
1. Enable 2FA on Gmail account
2. Generate App Password
3. Use app password in `SMTP_PASS`

### Custom SMTP (Hostinger, SendGrid, etc.)
1. Get SMTP credentials from provider
2. Configure in environment variables

## 🚢 Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production database
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring (PM2, Datadog, etc.)
- [ ] Configure logging
- [ ] Set up backups
- [ ] Add rate limiting
- [ ] Configure CDN for static files
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Review and rotate API keys
- [ ] Test payment webhooks
- [ ] Test email deliverability
- [ ] Test WhatsApp integration

## 🐛 Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Verify network connectivity
- Check SSL requirements

### Payment Webhook Not Working
- Verify webhook URL is publicly accessible
- Check Cashfree dashboard webhook configuration
- Verify signature validation

### Emails Not Sending
- Check SMTP credentials
- Verify SMTP port and security settings
- Check spam folder
- Verify sender domain SPF/DKIM records

### WhatsApp Not Sending
- Verify phone number format (+country code)
- Check API credentials
- Verify account status and limits
- Check message template approval status

## 📝 License

This project is private and proprietary.
