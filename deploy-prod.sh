#!/bin/bash

# Restaurant Table Reservation System - Production Deployment Script (IP-based)
# Usage: ./deploy-prod.sh

set -e

echo "Starting production deployment..."

# Configuration
BACKEND_DIR="back-end"
FRONTEND_DIR="front-end"

# Step 1: Update codebase
echo "Pulling latest code..."
git pull origin main || true

# Step 2: Install dependencies
echo "Installing backend dependencies..."
cd $BACKEND_DIR
npm ci
cd ..

echo "Installing frontend dependencies..."
cd $FRONTEND_DIR
npm ci
cd ..

# Step 3: Set up frontend environment BEFORE build
echo "Setting up frontend environment..."
cd $FRONTEND_DIR
rm -rf dist/  # Clean old build
cat > .env << 'ENVEOF'
VITE_API_URL=/api/v1
ENVEOF

# Step 4: Build frontend
echo "Building frontend..."
npm run build

# Step 5: Run database migrations
echo "Running database migrations..."
cd ../$BACKEND_DIR
if ! NODE_ENV=production npx sequelize db:migrate; then
  echo "Migration failed! Rolling back..."
  NODE_ENV=production npx sequelize db:migrate:undo
  echo "Rollback complete. Deployment aborted."
  exit 1
fi
cd ..

# Step 6: Start services with PM2
echo "Starting services with PM2..."

# Kill existing processes
pm2 delete rtrs-backend 2>/dev/null || true
pm2 delete rtrs-frontend 2>/dev/null || true

# Start backend
cd $BACKEND_DIR
pm2 start src/app.js --name rtrs-backend -i 1 --env production

# Start frontend
cd ../$FRONTEND_DIR
pm2 start npx --name rtrs-frontend -- serve -s dist -l 8080

pm2 save

echo "Production deployment complete!"
echo "Access at: http://YOUR_IP_ADDRESS/"
echo "API at: http://YOUR_IP_ADDRESS/api/v1/stats"
