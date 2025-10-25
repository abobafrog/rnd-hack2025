#!/bin/bash

# VPS Setup Script
echo "=== Setting up VPS for Conference App ==="

# VPS details
VPS_HOST="138.124.14.203"
VPS_USER="root"
VPS_PASS="RNixIsjtRgJ0"

echo "Connecting to VPS: $VPS_HOST"

# Connect to VPS and run setup commands
sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'

echo "=== VPS Setup Started ==="

# Update system
echo "Updating system..."
apt update -y

# Install Node.js
echo "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install MySQL client
echo "Installing MySQL client..."
apt-get install -y mysql-client

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Create application directory
echo "Creating application directory..."
mkdir -p /root/conference
cd /root/conference

# Create PM2 ecosystem config
echo "Creating PM2 config..."
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
    },
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOL

# Create logs directory
mkdir -p logs

# Setup firewall
echo "Configuring firewall..."
ufw allow 3000
ufw allow 22
ufw --force enable

# Create database
echo "Creating database..."
mysql -h localhost -u root -pRNixIsjtRgJ0 -e "CREATE DATABASE IF NOT EXISTS conference_db;" || echo "Database creation failed or already exists"

echo "=== VPS Setup Complete ==="
echo "Ready for application deployment!"
echo "Next steps:"
echo "1. Upload your application files"
echo "2. Run: npm install"
echo "3. Run: npm run db:migrate"
echo "4. Run: pm2 start ecosystem.config.js"

EOF

echo "=== VPS Setup Complete ==="
echo "VPS is ready for deployment!"
echo "Access: http://$VPS_HOST:3000"





