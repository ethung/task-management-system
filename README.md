# Planner Project

A modern productivity application for task and project management built with Next.js 15, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Docker** and Docker Compose
- **Git** for version control

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd plannerproject
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development environment:**
   ```bash
   npm run deploy:dev
   ```

5. **Access the application:**
   - **App**: http://localhost:3000
   - **Database GUI**: `npm run db:studio` → http://localhost:5555

## 🏗️ Tech Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict configuration
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis for sessions and caching
- **Styling**: Tailwind CSS v3 with Shadcn/UI components

### Development Tools
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **Testing**: Jest, React Testing Library (80% coverage minimum)
- **Build**: Turbopack for fast development and optimized production builds
- **Deployment**: Docker with multi-stage builds, GitHub Actions CI/CD

## 📁 Project Structure

```
plannerproject/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/UI base components
│   ├── layout/           # Layout components (Header, Sidebar, Footer)
│   ├── forms/            # Form components
│   └── data-display/     # Data visualization components
├── lib/                  # Utilities and shared logic
│   ├── db/              # Database utilities and queries
│   ├── utils/           # Helper functions and utilities
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # Application constants
│   ├── hooks/           # Custom React hooks
│   └── validations/     # Zod validation schemas
├── prisma/              # Database schema and migrations
├── styles/              # Global styles and Tailwind config
├── scripts/             # Build and deployment scripts
├── docs/                # Project documentation
└── __tests__/           # Test files and utilities
```

## 🛠️ Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run validate` | Run all quality checks |

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:reset` | Reset database |

### Deployment Commands

| Command | Description |
|---------|-------------|
| `npm run deploy:dev` | Deploy development environment |
| `npm run deploy:prod` | Deploy production environment |
| `npm run docker:build` | Build Docker image |
| `npm run docker:dev` | Start development containers |
| `npm run docker:prod` | Start production containers |

## 🗄️ Database Schema

### Core Models

- **Users**: Authentication and user profiles
- **Projects**: Organizational containers for tasks
- **Tasks**: Core task management with priorities and due dates

### Relationships

- Users can have multiple Projects
- Projects can have multiple Tasks
- Tasks belong to Users and optionally to Projects

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: All utility functions and business logic
- **Component Tests**: UI components with React Testing Library
- **Integration Tests**: API endpoints and database operations
- **Coverage**: Minimum 80% coverage requirement

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Development Environment

```bash
# Start everything with one command
npm run deploy:dev

# Or manually:
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

### Production Environment

```bash
# Set required environment variables
export POSTGRES_PASSWORD="your-secure-password"
export JWT_SECRET="your-jwt-secret"
export NEXTAUTH_SECRET="your-nextauth-secret"

# Deploy to production
npm run deploy:prod
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database
DATABASE_URL="postgresql://planneruser:plannerpass@localhost:5432/plannerproject_dev"

# Authentication
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Features
FEATURE_ANALYTICS_ENABLED="false"
```

## 🔒 Security

### Security Features

- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **Rate Limiting**: API endpoint protection
- **Authentication**: Secure JWT token management

### Best Practices

- Never commit secrets to version control
- Use environment variables for all configuration
- Regular dependency updates and security audits
- Enable all TypeScript strict mode checks

## 🎨 UI Components

### Design System

Based on **Shadcn/UI** with **Tailwind CSS**:

- **Consistent styling** with design tokens
- **Accessible components** following ARIA standards
- **Responsive design** for all screen sizes
- **Dark mode support** built-in

### Available Components

```typescript
import {
  Button,
  Card,
  Input,
  Label,
  Dialog,
  DropdownMenu
} from "@/components/ui";
```

## 📖 API Documentation

### Core Endpoints

- `GET /api/health` - Application health check
- `GET /api/db-health` - Database health and statistics
- `/api/users` - User management
- `/api/projects` - Project CRUD operations
- `/api/tasks` - Task management with pagination

### Example Usage

```typescript
// Create a new task
const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Complete documentation',
    priority: 'high',
    dueDate: '2024-01-15'
  })
});
```

## 🔧 Configuration

### TypeScript Configuration

- **Strict mode** enabled for maximum type safety
- **Path mapping** for clean imports (`@/components`)
- **Next.js optimization** settings

### ESLint Configuration

- **Next.js recommended** rules
- **Custom rules** for code quality
- **Import ordering** and formatting
- **React hooks** linting

### Prettier Configuration

- **Consistent formatting** across the codebase
- **Tailwind CSS** class sorting
- **Import organization**

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error:**
   ```bash
   # Check if containers are running
   docker compose ps

   # Restart database
   docker compose restart postgres
   ```

2. **Build Errors:**
   ```bash
   # Clean and rebuild
   npm run clean
   npm install
   npm run build
   ```

3. **Type Errors:**
   ```bash
   # Regenerate Prisma client
   npm run db:generate

   # Check types
   npm run typecheck
   ```

### Getting Help

1. Check the [troubleshooting guide](docs/troubleshooting.md)
2. Review application logs
3. Verify environment configuration
4. Check database connectivity

## 📚 Documentation

- **[Database Setup](docs/database-setup.md)** - Database configuration and management
- **[Deployment Guide](docs/deployment.md)** - Production deployment instructions
- **[Development Workflow](docs/development-workflow.md)** - Coding standards and practices
- **[API Documentation](docs/api-documentation.md)** - REST API reference
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding standards**: Run `npm run validate` before committing
4. **Write tests**: Maintain 80% coverage minimum
5. **Commit changes**: Use conventional commit messages
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Coding Standards

- Follow TypeScript strict mode
- Use functional components with hooks
- Write comprehensive tests
- Document complex logic
- Follow the established project structure

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Vercel** for hosting and deployment tools
- **Shadcn** for the beautiful UI components
- **Prisma** team for the excellent ORM
- **Tailwind CSS** for the utility-first styling approach

---

**Built with ❤️ using modern web technologies**

For more information, visit our [documentation](docs/) or contact the development team.