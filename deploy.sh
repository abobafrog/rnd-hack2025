#!/bin/bash

# Simple deployment script for VPS
echo "Deploying to VPS..."

# VPS details
VPS_HOST="138.124.14.203"
VPS_USER="root"
VPS_PASS="RNixIsjtRgJ0"
APP_DIR="/root/conference"

# Create application directory on VPS
echo "Creating directory on VPS..."
sshpass -p $VPS_PASS ssh $VPS_USER@$VPS_HOST "mkdir -p $APP_DIR"

# Copy application files
echo "Copying files to VPS..."
sshpass -p $VPS_PASS scp -r . $VPS_USER@$VPS_HOST:$APP_DIR/

# Setup application on VPS
echo "Setting up application on VPS..."
sshpass -p $VPS_PASS ssh $VPS_USER@$VPS_HOST << 'EOF'
cd /root/conference

# Update system
apt update

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install MySQL client
apt-get install -y mysql-client

# Install dependencies
npm install

# Create database
mysql -h localhost -u root -pRNixIsjtRgJ0 -e "CREATE DATABASE IF NOT EXISTS conference_db;" || echo "Database might already exist"

# Run migrations
npm run db:migrate || echo "Migrations might have failed, continuing..."

# Install PM2
npm install -g pm2

# Create PM2 config
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'conference-app',
    script: 'server/_core/index.ts',
    interpreter: 'tsx',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'mysql://root:RNixIsjtRgJ0@localhost:3306/conference_db',
      COOKIE_SECRET: 'your-secret-key-change-this-in-production'
    }
  }]
};
EOL

# Stop existing process
pm2 stop conference-app || echo "No existing process"

# Start application
pm2 start ecosystem.config.js
pm2 save

echo "Application deployed!"
echo "Access at: http://138.124.14.203:3000"
EOF

echo "Deployment complete!"


