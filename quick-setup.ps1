# Quick VPS Setup Script
Write-Host "=== Quick VPS Setup for Conference App ===" -ForegroundColor Green

$VPS_HOST = "138.124.14.203"
$VPS_USER = "root"
$VPS_PASS = "RNixIsjtRgJ0"

Write-Host "VPS: $VPS_HOST" -ForegroundColor Yellow
Write-Host "User: $VPS_USER" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Connect to VPS" -ForegroundColor Cyan
Write-Host "Run this command:" -ForegroundColor White
Write-Host "ssh $VPS_USER@$VPS_HOST" -ForegroundColor Gray
Write-Host "Password: $VPS_PASS" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 2: Run these commands on VPS:" -ForegroundColor Cyan
$commands = @"
# Update system
apt update -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs mysql-client

# Install PM2
npm install -g pm2

# Create app directory
mkdir -p /root/conference
cd /root/conference

# Setup firewall
ufw allow 3000
ufw allow 22
ufw --force enable

# Create database
mysql -h localhost -u root -p$VPS_PASS -e "CREATE DATABASE IF NOT EXISTS conference_db;"

# Create PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'conference-app',
    script: 'server/_core/index.ts',
    interpreter: 'tsx',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'mysql://root:$VPS_PASS@localhost:3306/conference_db',
      COOKIE_SECRET: 'your-secret-key-change-this-in-production'
    }
  }]
};
EOF

echo "VPS setup complete!"
echo "Ready for file upload..."
"@

Write-Host $commands -ForegroundColor Gray
Write-Host ""

Write-Host "Step 3: Upload files" -ForegroundColor Cyan
Write-Host "Run this command from your local machine:" -ForegroundColor White
Write-Host "scp -r . $VPS_USER@$VPS_HOST`:/root/conference/" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 4: Start application on VPS" -ForegroundColor Cyan
$startCommands = @"
cd /root/conference

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs conference-app --lines 10
"@

Write-Host $startCommands -ForegroundColor Gray
Write-Host ""

Write-Host "Step 5: Access your app" -ForegroundColor Cyan
Write-Host "http://$VPS_HOST:3000" -ForegroundColor Green
Write-Host ""

Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "Your conference app will be available at: http://$VPS_HOST:3000" -ForegroundColor Green





