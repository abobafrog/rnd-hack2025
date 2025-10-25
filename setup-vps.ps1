# PowerShell script to setup VPS
Write-Host "=== Setting up VPS for Conference App ===" -ForegroundColor Green

# VPS details
$VPS_HOST = "138.124.14.203"
$VPS_USER = "root"
$VPS_PASS = "RNixIsjtRgJ0"

Write-Host "Connecting to VPS: $VPS_HOST" -ForegroundColor Yellow

# Check if PuTTY is available
if (-not (Get-Command "plink" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing PuTTY..." -ForegroundColor Yellow
    winget install PuTTY.PuTTY
    Write-Host "Please restart PowerShell and run this script again" -ForegroundColor Red
    exit
}

# Connect to VPS and run setup commands
$setupCommands = @"
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
"@

# Execute commands on VPS
& plink -ssh -l $VPS_USER -pw $VPS_PASS $VPS_HOST $setupCommands

Write-Host "=== VPS Setup Complete ===" -ForegroundColor Green
Write-Host "VPS is ready for deployment!" -ForegroundColor Cyan
Write-Host "Access: http://$VPS_HOST:3000" -ForegroundColor Cyan


