#!/bin/bash

# Production deployment script
set -e

echo "🚀 Deploying to Production Environment..."

# Check required environment variables
required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "NEXTAUTH_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Environment variable $var is not set"
        exit 1
    fi
done

# Create production environment file
echo "📝 Creating production environment..."
cat > .env.production <<EOF
NODE_ENV=production
DATABASE_URL=postgresql://planneruser:${POSTGRES_PASSWORD}@postgres:5432/plannerproject
REDIS_URL=redis://redis:6379
JWT_SECRET=${JWT_SECRET}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL:-https://your-domain.com}
PORT=3000
EOF

# Build production images
echo "🏗️  Building production images..."
docker compose -f docker-compose.prod.yml build

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

# Start production services
echo "🚀 Starting production services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
timeout=120
counter=0

until docker compose -f docker-compose.prod.yml exec postgres pg_isready -U planneruser -d plannerproject > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -eq $timeout ]; then
        echo "❌ Database failed to start within $timeout seconds"
        exit 1
    fi
    echo "   Waiting for database... ($counter/$timeout)"
    sleep 1
done

# Run database migrations
echo "🔄 Running database migrations..."
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Health checks
echo "🏥 Running health checks..."
sleep 10

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Application health check passed"
        break
    fi

    attempt=$((attempt + 1))
    echo "   Health check attempt $attempt/$max_attempts"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Application health check failed after $max_attempts attempts"
    echo "📋 Container logs:"
    docker compose -f docker-compose.prod.yml logs app
    exit 1
fi

# Database health check
if curl -f http://localhost/api/db-health > /dev/null 2>&1; then
    echo "✅ Database health check passed"
else
    echo "❌ Database health check failed"
    exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker system prune -f

echo "🎉 Production deployment completed successfully!"
echo "📍 Application is running at: http://localhost"
echo "🔒 HTTPS available at: https://localhost (configure SSL certificates)"

# Clean up sensitive files
rm -f .env.production