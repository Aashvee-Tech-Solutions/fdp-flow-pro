# Aashvee FDP - Faculty Development Programs Platform

## Overview

Aashvee FDP is a web platform for managing Faculty Development Programs (FDPs) focused on NAAC and NBA accreditation training. The platform enables institutions to host FDP events and allows faculty members to register and participate in these professional development programs. Built with React, TypeScript, and modern UI components, it provides a streamlined registration and management experience for academic institutions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- React Router for client-side routing and navigation
- Single-page application (SPA) architecture

**UI Component Library**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui design system with Tailwind CSS for styling
- Custom theme system with CSS variables for light/dark mode support
- Light mode as default with dark mode toggle button in navbar
- Theme persistence using next-themes library
- Responsive design with mobile-first approach

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod resolvers for form validation
- Local component state using React hooks

**Styling Approach**
- Tailwind CSS utility-first styling with class-based dark mode
- CSS custom properties (variables) for theming in HSL format
- Light mode colors defined in :root, dark mode colors in .dark class
- Class variance authority (CVA) for component variants
- Theme switching via next-themes with localStorage persistence
- ThemeToggle component in navbar for user-controlled theme switching

**Key Design Patterns**
- Component composition with slot pattern from Radix UI
- Custom hooks for reusable logic (use-toast, use-mobile)
- Path aliases (@/) for clean imports
- Separation of UI components and page components

### Backend Architecture

**Server Framework & Runtime**
- Node.js with Express for RESTful API
- TypeScript for type-safe backend development
- Port 3000 for API server (configurable via PORT env var)
- CORS enabled for cross-origin requests

**Database & ORM**
- PostgreSQL database (fully portable to any provider)
- Drizzle ORM for type-safe database operations
- Drizzle Kit for schema migrations and management
- Environment-driven via DATABASE_URL

**Data Models** (shared/schema.ts)
- **FDP Events**: Core event information with categories, dates, fees, banners
- **Host Colleges**: Institution registrations with logo uploads and payment tracking
- **Faculty Registrations**: Individual faculty registrations with payment and status
- **Payments**: Complete payment records with gateway integration
- **Communication Logs**: Email/WhatsApp message tracking and delivery status
- **Certificates**: Generated certificates with download links and templates
- **Coupons**: Discount coupon system with validation and usage tracking
- **Admin Users**: Admin authentication and authorization (planned)

**Storage Layer** (server/storage.ts)
- Abstracted storage interface (IStorage)
- Complete CRUD operations for all entities
- Analytics and reporting functions
- Drizzle ORM implementation with PostgreSQL connection

**API Routes** (server/routes.ts)
- FDP Events: Create, read, update, delete operations
- Host College: Registration with file upload (logo)
- Faculty: Registration and management
- Payments: Order creation, verification, webhook handling
- Communications: Bulk email and WhatsApp messaging
- Analytics: Revenue, registrations, and participation metrics
- Coupons: Validation and application

**Input Validation**
- Zod schemas for all API inputs
- Type-safe validation using drizzle-zod
- Error handling with detailed validation messages
- File upload restrictions (size, type)

### External Integrations

**Email Service** (server/services/email.ts)
- **Nodemailer** for SMTP email delivery
- Configurable SMTP settings via environment variables
- Email templates: Confirmations, reminders, certificates, feedback
- HTML email support with inline styling
- Environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

**WhatsApp Service** (server/services/whatsapp.ts)
- **WhatsApp Cloud API (Meta)** - Primary integration
- **Twilio WhatsApp** - Fallback option
- Template and text message support
- Message templates: Confirmations, reminders, certificates
- Environment variables: 
  - Cloud API: WHATSAPP_PHONE_ID, WHATSAPP_TOKEN
  - Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER

**Payment Gateway** (server/services/payment.ts)
- **Cashfree** payment gateway integration
- Payment order creation and management
- Payment verification with signature validation
- Webhook support for payment status updates
- Refund functionality
- Environment variables: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_API_URL

**File Upload** (multer)
- Multer middleware for file handling
- Logo uploads for host colleges
- 5MB file size limit
- Image format validation (JPEG, PNG, GIF)
- Static file serving via Express

**UI & Component Libraries**
- **Radix UI**: Comprehensive set of accessible UI primitives
  - Dialog, Dropdown, Select, Toast, and 20+ other components
  - Ensures WCAG compliance and keyboard navigation

- **Lucide React**: Icon library for consistent iconography

- **Additional Libraries**
  - date-fns: Date manipulation and formatting
  - react-day-picker: Calendar/date picker component
  - embla-carousel-react: Touch-friendly carousel
  - cmdk: Command palette/search component
  - sonner: Toast notification system
  - vaul: Drawer component for mobile

**Development Tools**
- ESLint with TypeScript support for code quality
- PostCSS with Tailwind CSS and Autoprefixer
- Lovable component tagger for development mode

**Build & Deployment**
- Frontend: Static site generation via Vite build
- Backend: Node.js Express server
- Environment-specific builds (development/production modes)
- **Fully exportable to any hosting platform** (not tied to Replit)
- Deployment options: Vercel/Netlify + Railway/Render, DigitalOcean, AWS, Heroku, VPS

**Database Management**
- Drizzle Kit for schema generation and migrations
- Database push for schema synchronization
- Drizzle Studio for visual database management
- Commands: `npm run db:generate`, `npm run db:push`, `npm run db:studio`

**Development Workflow**
- `npm run dev` - Frontend only (Vite dev server)
- `npm run dev:backend` - Backend only (Express API server)
- `npm run dev:full` - Both frontend and backend concurrently
- `npm run start:backend` - Production backend server

## Recent Changes

### Backend System Implementation (October 2025)
- ✅ Complete database schema with Drizzle ORM (8 tables)
- ✅ Express API server with RESTful endpoints
- ✅ Email integration using Nodemailer with SMTP
- ✅ WhatsApp integration with Cloud API and Twilio support
- ✅ Cashfree payment gateway with webhook support
- ✅ Input validation using Zod schemas
- ✅ File upload security with Multer
- ✅ Complete storage interface with CRUD operations
- ✅ Analytics and reporting functions
- ✅ Bulk communication system
- ✅ Coupon validation system
- ✅ Environment-based configuration for portability
- ✅ Comprehensive deployment documentation

### Theme System Fix
- ✅ Replaced next-themes with custom React Context solution
- ✅ Fixed auto-refresh issue on theme toggle
- ✅ Light/dark mode with localStorage persistence
- ✅ Theme toggle in navbar