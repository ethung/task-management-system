# Development Workflow

This guide outlines the development workflow, coding standards, and best practices for the Planner Project.

## 🚀 Getting Started

### Initial Setup

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd plannerproject
   npm install
   cp .env.example .env.local
   ```

2. **Start development environment:**
   ```bash
   npm run deploy:dev
   ```

3. **Verify setup:**
   ```bash
   npm run validate
   ```

## 📝 Coding Standards

### TypeScript Guidelines

- **Use strict mode**: All TypeScript strict checks enabled
- **Type everything**: Avoid `any` types, prefer explicit types
- **Interface over type**: Use interfaces for object shapes
- **Utility types**: Leverage TypeScript utility types

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string | null;
}

// ❌ Avoid
const user: any = { id: 1, email: "test" };
```

### React Component Standards

- **Functional components**: Use function components with hooks
- **Props interfaces**: Define props with TypeScript interfaces
- **Component organization**: Follow single responsibility principle

```typescript
// ✅ Good component structure
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant, children, onClick }: ButtonProps) {
  return (
    <button
      className={cn('btn', `btn-${variant}`)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### File Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ROUTES`)
- **Files**: kebab-case for files (`user-profile.test.tsx`)

### Import Organization

```typescript
// 1. Node modules
import { useState, useEffect } from 'react';
import { NextRequest } from 'next/server';

// 2. Internal imports (absolute paths)
import { Button } from '@/components/ui';
import { formatDate } from '@/lib/utils';

// 3. Relative imports
import './styles.css';
```

## 🧪 Testing Standards

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
describe('formatDate', () => {
  it('formats date correctly', () => {
    // Arrange
    const date = new Date('2023-12-25');

    // Act
    const result = formatDate(date);

    // Assert
    expect(result).toBe('December 25, 2023');
  });
});
```

### Testing Guidelines

- **Test file naming**: `component.test.tsx` or `utility.test.ts`
- **Coverage requirement**: Minimum 80% coverage
- **Test categories**:
  - Unit tests for utilities and business logic
  - Component tests for UI components
  - Integration tests for API endpoints

### Test Organization

```
__tests__/
├── components/        # Component tests
├── utils/            # Utility function tests
├── api/              # API endpoint tests
└── integration/      # Integration tests
```

## 🔄 Git Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature development branches
- **hotfix/***: Critical production fixes

### Commit Messages

Use conventional commit format:

```
type(scope): description

feat(auth): add user registration
fix(api): resolve database connection issue
docs(readme): update installation instructions
test(utils): add tests for date formatting
```

### Pull Request Process

1. **Create feature branch:**
   ```bash
   git checkout -b feature/user-authentication
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat(auth): implement user login"
   ```

3. **Run quality checks:**
   ```bash
   npm run validate
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/user-authentication
   ```

5. **PR Requirements:**
   - All tests pass
   - Code coverage maintained
   - Documentation updated
   - Review approval required

## 🛠️ Development Tools

### Pre-commit Hooks

Husky runs these checks before each commit:
- ESLint for code quality
- Prettier for formatting
- TypeScript type checking

### IDE Configuration

**VS Code** recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Hero
- Auto Rename Tag

### Code Quality Tools

- **ESLint**: Identifies code issues
- **Prettier**: Enforces consistent formatting
- **TypeScript**: Provides static type checking
- **Jest**: Testing framework with coverage

## 📦 Package Management

### Adding Dependencies

1. **Production dependency:**
   ```bash
   npm install package-name --legacy-peer-deps
   ```

2. **Development dependency:**
   ```bash
   npm install --save-dev package-name --legacy-peer-deps
   ```

3. **Update package.json** and commit

### Dependency Guidelines

- **Minimize dependencies**: Only add what's necessary
- **Security audits**: Run `npm audit` regularly
- **Version pinning**: Use exact versions for critical packages
- **License compliance**: Verify license compatibility

## 🚀 Development Commands

### Daily Development

```bash
# Start development
npm run dev

# Run tests in watch mode
npm run test:watch

# Check code quality
npm run validate

# Database operations
npm run db:studio
npm run db:seed
```

### Before Committing

```bash
# Run all quality checks
npm run validate

# Fix formatting issues
npm run format

# Fix linting issues
npm run lint:fix
```

### Database Development

```bash
# Schema changes
npm run db:push

# Create migration
npm run db:migrate

# Reset database
npm run db:reset
```

## 🏗️ Component Development

### Component Structure

```typescript
// components/ui/Button.tsx
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          {
            'bg-primary text-primary-foreground': variant === 'default',
            'border border-input': variant === 'outline',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
```

### Styling Guidelines

- **Tailwind CSS**: Use utility classes
- **Component variants**: Use `cva` for component variations
- **Responsive design**: Mobile-first approach
- **Accessibility**: Include proper ARIA attributes

## 📚 Documentation Standards

### Code Documentation

```typescript
/**
 * Formats a date string for display
 * @param date - The date to format
 * @param format - The format string (optional)
 * @returns Formatted date string
 */
export function formatDate(date: Date, format?: string): string {
  // Implementation
}
```

### Component Documentation

```typescript
/**
 * Primary UI button component
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export function Button({ variant = 'default', ...props }: ButtonProps) {
  // Component implementation
}
```

## 🔍 Debugging

### Debug Tools

- **React Developer Tools**: Component inspection
- **Prisma Studio**: Database visualization
- **Network tab**: API request debugging
- **Console logging**: Strategic logging for development

### Common Debugging Patterns

```typescript
// Debug API calls
console.log('API Request:', { url, payload });

// Debug component renders
useEffect(() => {
  console.log('Component mounted with props:', props);
}, []);

// Debug database queries
const result = await prisma.user.findMany();
console.log('Query result:', result);
```

## 🚨 Error Handling

### Frontend Error Handling

```typescript
// API error handling
try {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API call failed:', error);
  // Handle error appropriately
}
```

### Backend Error Handling

```typescript
// API route error handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await processRequest(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🎯 Performance Guidelines

### Frontend Performance

- **Code splitting**: Use dynamic imports for large components
- **Image optimization**: Use Next.js Image component
- **Bundle analysis**: Run `npm run build:analyze`
- **Lazy loading**: Implement for non-critical components

### Database Performance

- **Query optimization**: Use appropriate indexes
- **Connection pooling**: Configure Prisma connection limits
- **Query analysis**: Monitor slow queries
- **Data pagination**: Implement for large datasets

## 📋 Code Review Checklist

### Before Creating PR

- [ ] All tests pass (`npm run test`)
- [ ] Code coverage maintained
- [ ] TypeScript checks pass (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Formatting applied (`npm run format`)
- [ ] Documentation updated
- [ ] Manual testing completed

### During Code Review

- [ ] Code follows established patterns
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Accessibility requirements met
- [ ] Test coverage adequate

This workflow ensures consistent, high-quality code across the entire project while maintaining developer productivity and code maintainability.