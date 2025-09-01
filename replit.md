# Online Appointment Booking System

## Overview

This is a modern online appointment booking system designed for beauty salons, manicures, and similar service businesses. The system provides a streamlined booking experience for clients without requiring account creation, while offering comprehensive management tools for business owners. Built with React, TypeScript, and Express, it features a clean, responsive interface optimized for both desktop and mobile use.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React 18 and TypeScript, using Vite as the build tool. The frontend follows a component-based architecture with:

- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and data fetching
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

The application is structured with clear separation between pages (`/pages`), reusable components (`/components`), and utility functions (`/lib`). Component organization follows atomic design principles with a comprehensive UI component library.

### Backend Architecture
The server is built with Express.js and follows a RESTful API pattern:

- **Server Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for request/response validation
- **Architecture Pattern**: Repository pattern with storage abstraction
- **Development**: Hot reload with Vite integration

The backend implements a clean separation of concerns with routes, storage layer, and schema definitions in separate modules.

### Database Design
PostgreSQL database with Drizzle ORM providing type-safe database operations:

- **appointments**: Core booking data with client information, date/time, and status
- **managers**: Admin user management with simple username/password authentication
- **time_slots**: Configurable available time slots for bookings

The schema uses UUIDs for primary keys and includes proper constraints and defaults. Database migrations are managed through Drizzle Kit.

### Key Features Architecture

**Multi-Step Booking Flow**: 
- Step-by-step form with client details, date selection, and time slot picking
- Real-time availability checking to prevent double bookings
- Form validation at each step with user-friendly error messages

**Manager Dashboard**:
- Login-protected admin interface with session management
- Date-filtered appointment views with search and filtering
- Direct WhatsApp integration for customer communication
- Dashboard statistics and analytics

**Responsive Design**:
- Mobile-first approach with Tailwind CSS breakpoints
- Touch-friendly interface for mobile booking
- Adaptive layouts for different screen sizes

### Authentication & Authorization
Simple authentication system for managers:
- Basic username/password login (admin/admin for development)
- Session-based authentication
- Protected routes for admin functionality
- No authentication required for client booking flow

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon Database serverless driver for PostgreSQL connectivity
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migrations and schema management
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

### UI & Styling Dependencies
- **@radix-ui/***: Comprehensive suite of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility
- **cmdk**: Command palette component

### Development Dependencies
- **vite**: Fast build tool and development server
- **@vitejs/plugin-react**: React support for Vite
- **typescript**: Type checking and compilation
- **esbuild**: Fast JavaScript bundler for production builds

### Utility Dependencies
- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation
- **connect-pg-simple**: PostgreSQL session store for Express sessions

The system is designed to be easily deployable with minimal external service dependencies, requiring only a PostgreSQL database connection.