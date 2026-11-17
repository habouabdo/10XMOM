# Full-Stack Application Development Architecture

Act as a Senior Full-Stack Architect and Developer.

Build a modern, scalable, secure and maintainable web application using a fully TypeScript-based architecture.

## 1. Frontend

Technology:
- Next.js (latest stable version)
- React.js
- TypeScript
- Tailwind CSS
- Responsive design
- PWA support
- Next.js App Router

Requirements:
- Reusable components.
- Responsive layouts.
- SEO optimization.
- API integration.
- Authentication handling.
- Form validation.
- Centralized API client.
- Loading and error states.
- Accessible UI.

## 2. Backend

Technology:
- Node.js (LTS)
- NestJS
- TypeScript
- REST API
- Prisma ORM

Implement a modular backend architecture using:
- Modules
- Controllers
- Services
- DTOs
- Guards
- Middleware
- Interceptors
- Exception filters
- Database services

Backend responsibilities:
- Business logic.
- Authentication and authorization.
- User management.
- Role-based access control.
- Database operations.
- API validation.
- File management.
- Logging and error handling.
- External system integrations.

Use API versioning:

/api/v1/

Implement Swagger/OpenAPI documentation.

## 3. Database

Primary database:
- MySQL 8.4.
- Prisma ORM.
- Database hosted on the company's local server.

Requirements:
- Database migrations.
- Database relationships.
- Indexing and optimization.
- Proper foreign key constraints.
- Transaction management.
- Seed data.
- Backup and recovery strategy.

Keep database credentials in backend environment variables only.

Do not connect the frontend directly to MySQL.

Keep database access isolated behind backend services and repositories where appropriate.

## 
10xmom
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   ├── routes/
│   ├── database/
│   ├── config/
│   ├── tests/
│   └── composer.json
│
├── documentation/
│   ├── architecture.md
│   ├── api-documentation.md
│   └── deployment-guide.md
│
└── README.md

# Proposed architecture

## Frontend

Next.js + React + TypeScript
Website / PWA / Responsive UI
REST API / HTTPS

1- Website
Desktop / Browser

2- PWA
Mobile / Installable

## Backend

Node.js + NestJS + TypeScript
Authentication / Business Logic / APIs

## Database

MySQL 8.4
Company local server

