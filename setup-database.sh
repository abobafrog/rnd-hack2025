#!/bin/bash

# Database setup script
# Reads credentials from environment variables or .env file

set -e  # Exit on error

echo "=== Database Setup ==="

# Load environment variables if .env exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Database connection details (can be overridden by env vars)
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_NAME="${DB_NAME:-conference_db}"

if [ -z "$DB_PASS" ]; then
  echo "Error: DB_PASS environment variable is not set"
  echo "Please set it in .env file or export it"
  exit 1
fi

echo "Host: $DB_HOST"
echo "User: $DB_USER"
echo "Database: $DB_NAME"

# Create database
echo "Creating database..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" || {
  echo "Warning: Database creation might have failed or database already exists"
}

echo "✅ Database '$DB_NAME' ready"

# Run migrations
echo "Running database migrations..."
if command -v pnpm &> /dev/null; then
  pnpm run db:push || echo "Warning: Migrations might have failed"
else
  npm run db:push || echo "Warning: Migrations might have failed"
fi

echo "✅ Database setup complete!"



