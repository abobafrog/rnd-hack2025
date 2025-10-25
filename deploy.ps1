# PowerShell deployment script for VPS
Write-Host "Deploying conference app to VPS..." -ForegroundColor Green

# VPS details
$VPS_HOST = "138.124.14.203"
$VPS_USER = "root"
$VPS_PASS = "RNixIsjtRgJ0"
$APP_DIR = "/root/conference"

# Install required tools
Write-Host "Installing required tools..." -ForegroundColor Yellow
winget install OpenSSH.Client
winget install PuTTY.PuTTY

# Create application directory on VPS
Write-Host "Creating directory on VPS..." -ForegroundColor Yellow
$createDirCmd = "mkdir -p $APP_DIR"
& plink -ssh -l $VPS_USER -pw $VPS_PASS $VPS_HOST $createDirCmd

# Copy application files
Write-Host "Copying files to VPS..." -ForegroundColor Yellow
& pscp -r -pw $VPS_PASS . $VPS_USER@$VPS_HOST`:$APP_DIR/

# Setup application on VPS
Write-Host "Setting up application on VPS..." -ForegroundColor Yellow
$setupScript = @"
cd $APP_DIR

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
mysql -h localhost -u root -p$VPS_PASS -e "CREATE DATABASE IF NOT EXISTS conference_db;" || echo "Database might already exist"

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
      DATABASE_URL: 'mysql://root:$VPS_PASS@localhost:3306/conference_db',
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
echo "Access at: http://$VPS_HOST:3000"
"@

& plink -ssh -l $VPS_USER -pw $VPS_PASS $VPS_HOST $setupScript

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Access your app at: http://$VPS_HOST:3000" -ForegroundColor Cyan


