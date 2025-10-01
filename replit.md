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

**Database & Backend Services**
- Supabase for backend-as-a-service
- PostgreSQL database (via Supabase)
- Auto-generated TypeScript types from database schema
- Real-time capabilities through Supabase client

**Authentication**
- Supabase Auth with localStorage persistence
- Auto-refresh token mechanism
- Session management handled by Supabase client

**Data Models** (from types.ts)
- FDP Events: Core event information with categories, dates, fees
- Host Registrations: Institution/college registrations for hosting events
- Faculty Registrations: Individual faculty member registrations
- Communication Logs: Email/SMS tracking for notifications
- Payment Tracking: Integration readiness for payment processing

### External Dependencies

**Third-Party Services**
- **Supabase**: Database, authentication, and real-time backend services
  - Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
  - Uses localStorage for session persistence

- **Payment Gateway** (Planned Integration)
  - Cashfree payment integration mentioned in code comments
  - Currently using mock payment flows in registration forms

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
- Static site generation via Vite build
- Environment-specific builds (development/production modes)
- Configured for deployment on Lovable platform