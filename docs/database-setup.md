# Database Setup Guide

This project uses PostgreSQL as the primary database with Prisma as the ORM.

## Quick Start

### 1. Start the Database

Start PostgreSQL and Redis using Docker Compose:

```bash
docker compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### 2. Run Database Migrations

```bash
npm run db:migrate
```

### 3. Seed the Database

```bash
npm run db:seed
```

### 4. Verify Setup

Test the database connection:
```bash
curl http://localhost:3000/api/db-health
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Create and run migrations |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:reset` | Reset database and re-run migrations |

## Database Schema

### Users
- `id` - Unique identifier (cuid)
- `email` - User email (unique)
- `name` - User display name
- `avatar` - Profile picture URL
- `createdAt` / `updatedAt` - Timestamps

### Projects
- `id` - Unique identifier (cuid)
- `name` - Project name
- `description` - Project description
- `color` - Project color (hex)
- `userId` - Owner reference
- `createdAt` / `updatedAt` - Timestamps

### Tasks
- `id` - Unique identifier (cuid)
- `title` - Task title
- `description` - Task description
- `completed` - Completion status
- `priority` - LOW | MEDIUM | HIGH
- `dueDate` - Optional due date
- `projectId` - Optional project reference
- `userId` - Owner reference
- `createdAt` / `updatedAt` - Timestamps

## Environment Variables

Copy `.env.example` to `.env.local` and update the database URL:

```bash
DATABASE_URL="postgresql://planneruser:plannerpass@localhost:5432/plannerproject_dev"
```

## Database Utilities

The project includes type-safe database utilities in `lib/db/`:

- `lib/db/users.ts` - User CRUD operations
- `lib/db/projects.ts` - Project CRUD operations
- `lib/db/tasks.ts` - Task CRUD operations with pagination

Example usage:

```typescript
import { createUser, getUserById } from "@/lib/db/users";

const user = await createUser({
  email: "user@example.com",
  name: "John Doe"
});
```

## Troubleshooting

### Database Connection Issues

1. Ensure Docker containers are running:
   ```bash
   docker compose ps
   ```

2. Check container logs:
   ```bash
   docker compose logs postgres
   ```

3. Verify environment variables in `.env.local`

### Schema Changes

When modifying the Prisma schema:

1. Generate new client:
   ```bash
   npm run db:generate
   ```

2. Create migration:
   ```bash
   npm run db:migrate
   ```

### Reset Everything

To start fresh:
```bash
npm run db:reset
npm run db:seed
```

## Production Considerations

- Use connection pooling for high-traffic applications
- Enable query logging in development only
- Set up database backups and monitoring
- Use read replicas for scaling reads
- Consider using Prisma Accelerate for caching