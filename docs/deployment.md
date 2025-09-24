# Deployment Guide

This guide covers deploying the Planner Project application to different environments.

## Quick Start

### Development Deployment

1. **Start development environment:**
   ```bash
   ./scripts/deploy-dev.sh
   ```

2. **Access the application:**
   - App: http://localhost:3000
   - Database GUI: `npm run db:studio` → http://localhost:5555

### Production Deployment

1. **Set environment variables:**
   ```bash
   export POSTGRES_PASSWORD="your-secure-password"
   export JWT_SECRET="your-jwt-secret"
   export NEXTAUTH_SECRET="your-nextauth-secret"
   export NEXTAUTH_URL="https://your-domain.com"
   ```

2. **Deploy to production:**
   ```bash
   ./scripts/deploy-prod.sh
   ```

## Environment Setup

### Development Environment

The development environment uses:
- **Database**: PostgreSQL (localhost:5432)
- **Cache**: Redis (localhost:6379)
- **App**: Next.js dev server (localhost:3000)

```bash
# Start all services
docker compose up -d

# Run migrations and seed
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### Production Environment

The production environment includes:
- **App**: Dockerized Next.js application
- **Database**: PostgreSQL with persistent storage
- **Cache**: Redis for sessions and caching
- **Reverse Proxy**: Nginx with SSL termination
- **Security**: Rate limiting, security headers

```bash
# Production deployment
docker compose -f docker-compose.prod.yml up -d
```

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`):
   - Runs on push/PR to main
   - Linting, type checking, testing
   - Security scanning
   - Docker image building

2. **Deployment Pipeline** (`.github/workflows/deploy.yml`):
   - Runs on push to main or version tags
   - Builds and pushes Docker images
   - Deploys to production environment
   - Post-deployment health checks

### Required Secrets

Configure these secrets in GitHub repository settings:

```bash
# For Docker registry
GITHUB_TOKEN  # Automatically provided

# For deployment (if using SSH deployment)
DEPLOY_HOST   # Server hostname or IP
DEPLOY_USER   # SSH username
DEPLOY_KEY    # SSH private key

# For notifications
SLACK_WEBHOOK_URL  # Slack webhook for deployment notifications
```

## Docker Configuration

### Multi-stage Dockerfile

The production Dockerfile uses multi-stage builds:

1. **deps**: Install production dependencies
2. **builder**: Build the application
3. **runner**: Run the production application

Benefits:
- Smaller final image size
- Faster builds with layer caching
- Security isolation

### Docker Compose Files

- `docker-compose.yml`: Development environment
- `docker-compose.prod.yml`: Production environment

Key differences:
- Production uses built Docker images
- Development mounts source code
- Production includes Nginx reverse proxy
- Different environment variable configurations

## Health Checks

### Application Health

- **Endpoint**: `/api/health`
- **Response**: Application status and timestamp
- **Docker**: Built-in health check

### Database Health

- **Endpoint**: `/api/db-health`
- **Response**: Database connection status and statistics
- **Monitoring**: Connection pool status

### Health Check Script

```bash
# Manual health check
curl -f http://localhost:3000/api/health
curl -f http://localhost:3000/api/db-health
```

## Monitoring and Logging

### Application Monitoring

Configure monitoring for:
- Application uptime
- Response times
- Error rates
- Database performance

### Log Aggregation

Production logs are available via:
```bash
# Application logs
docker compose -f docker-compose.prod.yml logs app

# Database logs
docker compose -f docker-compose.prod.yml logs postgres

# All services
docker compose -f docker-compose.prod.yml logs
```

## Security Considerations

### SSL/TLS Configuration

1. **Obtain SSL certificates:**
   ```bash
   # Using Let's Encrypt
   certbot certonly --webroot -w /var/www/html -d your-domain.com
   ```

2. **Update Nginx configuration:**
   - Certificate paths in `nginx/nginx.conf`
   - SSL settings and security headers

### Environment Variables

- Never commit secrets to version control
- Use `.env.example` templates
- Rotate secrets regularly
- Use secure random generation for tokens

### Network Security

- Configure firewall rules
- Use VPN for database access
- Enable fail2ban for SSH protection
- Regular security updates

## Backup and Recovery

### Database Backup

```bash
# Create backup
./scripts/backup-db.sh [backup-name]

# Restore from backup
./scripts/restore-db.sh path/to/backup.sql.gz
```

### Application Data

- User-uploaded files (if any)
- Configuration files
- SSL certificates

### Disaster Recovery

1. **Backup Strategy:**
   - Daily automated database backups
   - Weekly full system backups
   - Off-site backup storage

2. **Recovery Procedures:**
   - Database restoration
   - Application redeployment
   - DNS and certificate management

## Scaling Considerations

### Horizontal Scaling

- Load balancer configuration
- Database connection pooling
- Redis clustering
- CDN for static assets

### Performance Optimization

- Database indexing
- Query optimization
- Caching strategies
- Image optimization

## Troubleshooting

### Common Issues

1. **Database Connection Failed:**
   ```bash
   # Check database status
   docker compose logs postgres

   # Verify credentials
   docker compose exec postgres psql -U planneruser -d plannerproject
   ```

2. **Application Won't Start:**
   ```bash
   # Check application logs
   docker compose logs app

   # Verify environment variables
   docker compose exec app env | grep DATABASE_URL
   ```

3. **SSL Certificate Issues:**
   ```bash
   # Check certificate validity
   openssl x509 -in cert.pem -text -noout

   # Test SSL configuration
   curl -I https://your-domain.com
   ```

### Debug Mode

Enable debug mode for troubleshooting:
```bash
# Set debug environment
export DEBUG=true
export LOG_LEVEL=debug

# Restart with debug logging
docker compose restart app
```

## Support

For deployment issues:
1. Check application logs
2. Verify environment configuration
3. Test database connectivity
4. Review security settings
5. Consult troubleshooting guide