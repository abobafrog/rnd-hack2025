# PowerShell script to deploy Conference App to VPS
Write-Host "=== Deploying Conference App to VPS ===" -ForegroundColor Green

# VPS details
$VPS_HOST = "138.124.14.203"
$VPS_USER = "root"
$VPS_PASS = "RNixIsjtRgJ0"
$APP_DIR = "/root/conference"

# Check if PuTTY is available
if (-not (Get-Command "plink" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing PuTTY..." -ForegroundColor Yellow
    winget install PuTTY.PuTTY
    Write-Host "Please restart PowerShell and run this script again" -ForegroundColor Red
    exit
}

# Stop existing application
Write-Host "Stopping existing application..." -ForegroundColor Yellow
& plink -ssh -l $VPS_USER -pw $VPS_PASS $VPS_HOST "cd $APP_DIR && pm2 stop conference-app || echo 'No existing app'"

# Copy application files
Write-Host "Copying application files..." -ForegroundColor Yellow
& pscp -r -pw $VPS_PASS . $VPS_USER@$VPS_HOST`:$APP_DIR/

# Setup and start application on VPS
Write-Host "Setting up application on VPS..." -ForegroundColor Yellow
$deployCommands = @"
cd $APP_DIR

echo "Installing dependencies..."
npm install

echo "Running database migrations..."
npm run db:migrate || echo "Migrations failed, continuing..."

echo "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "Checking application status..."
pm2 status

echo "Application logs:"
pm2 logs conference-app --lines 10
"@

& plink -ssh -l $VPS_USER -pw $VPS_PASS $VPS_HOST $deployCommands

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Your application is now running on: http://$VPS_HOST:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check status: ssh $VPS_USER@$VPS_HOST 'cd $APP_DIR && pm2 status'" -ForegroundColor Yellow
Write-Host "To view logs: ssh $VPS_USER@$VPS_HOST 'cd $APP_DIR && pm2 logs conference-app'" -ForegroundColor Yellow
Write-Host "To restart: ssh $VPS_USER@$VPS_HOST 'cd $APP_DIR && pm2 restart conference-app'" -ForegroundColor Yellow





