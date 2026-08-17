#!/bin/bash

# Restaurant Table Reservation System - Production Deployment Script (Podman-based)
# Usage: ./deploy-prod.sh

set -e

echo "Starting production deployment..."

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"

# Step 1: Build and start services
echo "Building and starting services..."
podman-compose -f $COMPOSE_FILE build
podman-compose -f $COMPOSE_FILE up -d

# Step 2: Run database migrations
echo "Running database migrations..."
podman-compose -f $COMPOSE_FILE exec -T backend npx sequelize db:migrate

echo "Production deployment complete!"
echo "Access at: http://YOUR_IP_ADDRESS/"
echo "API at: http://YOUR_IP_ADDRESS/api/v1/stats"
