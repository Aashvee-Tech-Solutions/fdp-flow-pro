# AI Rules for FDP Management System

This document outlines the core technologies and specific library usage guidelines for developing the Aashvee FDP Management System. Adhering to these rules ensures consistency, maintainability, and leverages the strengths of our chosen tech stack.

## Tech Stack Overview

The application is built with a modern, full-stack JavaScript/TypeScript architecture:

*   **Frontend**: React 18 with TypeScript, powered by Vite for a fast development experience.
*   **UI/Styling**: Tailwind CSS for utility-first styling, complemented by `shadcn/ui` components for a consistent and accessible design system.
*   **Client-Side Routing**: `react-router-dom` for declarative navigation within the single-page application.
*   **Data Management (Frontend)**: `TanStack Query` (React Query) for efficient server state management, caching, and data synchronization.
*   **Form Handling**: `react-hook-form` for robust form management, integrated with `zod` for schema-based validation.
*   **Icons**: `lucide-react` for a comprehensive and customizable icon set.
*   **Backend**: Node.js with Express.js for building a scalable RESTful API.
*   **Database**: PostgreSQL as the relational database, managed with `Drizzle ORM` for type-safe interactions.
*   **External Integrations**: Nodemailer for email, WhatsApp Cloud API/Twilio for WhatsApp messages, and Cashfree for payment processing.
*   **PDF Generation**: Puppeteer for server-side PDF certificate generation.

## Library Usage Rules

To maintain a cohesive and efficient codebase, please follow these guidelines for library usage:

*   **Frontend UI Components**: Always prioritize `shadcn/ui` components. If a specific component is not available, create a new, small component using Radix UI primitives and style it with Tailwind CSS. Do not modify existing `shadcn/ui` files.
*   **Styling**: Use Tailwind CSS exclusively for all styling. Avoid custom CSS files or inline styles unless absolutely necessary for global overrides (e.g., `src/index.css`).
*   **Forms & Validation (Frontend)**: Use `react-hook-form` for all form logic and `zod` for defining validation schemas.
*   **Data Fetching & Server State (Frontend)**: Use `TanStack Query` (React Query) for all interactions with the backend API (fetching, mutations, caching).
*   **Client-Side Routing**: All navigation within the React application must use `react-router-dom`.
*   **Icons**: All icons should be sourced from `lucide-react`.
*   **Backend API Development**: Use `Express.js` for defining API routes and middleware.
*   **Database Interactions (Backend)**: All database operations (CRUD, queries) must be performed using `Drizzle ORM` with the defined schema.
*   **Input Validation (Backend)**: Validate all incoming API request bodies using `zod` schemas.
*   **File Uploads (Backend)**: Use `multer` for handling file uploads (e.g., college logos).
*   **Email Services**: Use the `nodemailer` library via the `server/services/email.ts` module for sending all emails.
*   **WhatsApp Messaging**: Use the `sendWhatsAppMessage` function from `server/services/whatsapp.ts` for sending WhatsApp notifications.
*   **Payment Gateway**: Integrate with the Cashfree payment gateway using the functions provided in `server/services/payment.ts`.
*   **PDF Generation**: Use `puppeteer` via the `server/services/certificate.ts` module for generating PDF certificates.
*   **Theme Management**: Use the custom `ThemeProvider` and `useTheme` hook located in `src/hooks/use-theme.tsx` for light/dark mode functionality.
*   **Toast Notifications**: Use `sonner` for displaying transient, non-blocking notifications to the user.