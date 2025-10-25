#!/bin/bash

# Database setup script for VPS
echo "Setting up database on VPS..."

# Database connection details
DB_HOST="138.124.14.203"
DB_USER="root"
DB_PASS="RNixIsjtRgJ0"
DB_NAME="conference_db"

# Create database
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

echo "Database $DB_NAME created successfully!"

# Run migrations
echo "Running database migrations..."
npm run db:migrate

echo "Database setup complete!"


