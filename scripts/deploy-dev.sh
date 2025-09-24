#!/bin/bash

# Development deployment script
set -e

echo "🚀 Deploying to Development Environment..."

# Build and start services
echo "📦 Building and starting services..."
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0

until docker compose exec postgres pg_isready -U planneruser -d plannerproject_dev > /dev/null 2>&1; do
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
npm run db:push

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

# Health check
echo "🏥 Running health checks..."
sleep 5

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    exit 1
fi

if curl -f http://localhost:3000/api/db-health > /dev/null 2>&1; then
    echo "✅ Database health check passed"
else
    echo "❌ Database health check failed"
    exit 1
fi

echo "🎉 Development deployment completed successfully!"
echo "📍 Application is running at: http://localhost:3000"
echo "🗄️  Database GUI available at: http://localhost:5555 (run 'npm run db:studio')"